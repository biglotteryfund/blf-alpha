'use strict';
const { forEach, pickBy } = require('lodash');
const config = require('config');
const express = require('express');
const favicon = require('serve-favicon');
const i18n = require('i18n-2');
const nunjucks = require('nunjucks');
const path = require('path');
const Raven = require('raven');
const yaml = require('js-yaml');
const debug = require('debug')('biglotteryfund:server');

const app = express();
module.exports = app;

const appData = require('./modules/appData');

if (appData.isDev) {
    require('dotenv').config();
}

const { makeWelsh, localify } = require('./modules/urls');
const { proxyPassthrough, postToLegacyForm } = require('./modules/legacy');
const { renderError, renderNotFound, renderUnauthorised } = require('./controllers/errors');
const { SENTRY_DSN } = require('./modules/secrets');
const aliases = require('./controllers/aliases');
const formHelpers = require('./modules/forms');
const routes = require('./controllers/routes');
const viewFilters = require('./modules/filters');

const { defaultSecurityHeaders } = require('./middleware/securityHeaders');
const bodyParserMiddleware = require('./middleware/bodyParser');
const cached = require('./middleware/cached');
const i18nMiddleware = require('./middleware/i18n');
const localsMiddleware = require('./middleware/locals');
const loggerMiddleware = require('./middleware/logger');
const passportMiddleware = require('./middleware/passport');
const portalMiddleware = require('./middleware/portal');
const previewMiddleware = require('./middleware/preview');
const redirectsMiddleware = require('./middleware/redirects');
const sessionMiddleware = require('./middleware/session');
const timingsMiddleware = require('./middleware/timings');

/**
 * Configure Sentry client
 * @see https://docs.sentry.io/clients/node/config/
 */
Raven.config(SENTRY_DSN, {
    logger: 'server',
    environment: appData.environment,
    release: appData.commitId,
    autoBreadcrumbs: true,
    dataCallback(data) {
        delete data.modules; // Clear installed node_modules
        delete data.request.data; // Clear POST data
        return data;
    }
}).install();

app.use(Raven.requestHandler());

/**
 * Set up internationalisation
 */
i18n.expressBind(app, {
    locales: ['en', 'cy'],
    directory: './config/locales',
    extension: '.yml',
    parse: data => yaml.safeLoad(data),
    dump: data => yaml.safeDump(data),
    devMode: false
});

/**
 * Static asset paths
 * Mount early to avoid being processed by any middleware
 */
app.use(favicon(path.join('public', '/favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, './public')));

/**
 * Define common app locals
 * @see https://expressjs.com/en/api.html#app.locals
 */
function initAppLocals() {
    // Environment metadata
    app.locals.appData = appData;
    // Common date formats
    app.locals.DATE_FORMATS = config.get('dateFormats');
    // Assume page is bilingual by default
    app.locals.isBilingual = true;
    // Navigation sections for top-level nav
    app.locals.navigationSections = pickBy(routes.sections, s => s.showInNavigation);
    // Default pageAccent colour
    app.locals.pageAccent = 'pink';
    // Form helpers
    app.locals.formHelpers = formHelpers;
}

initAppLocals();

/**
 * Configure view engine
 * @see https://mozilla.github.io/nunjucks/api.html
 */
function initViewEngine() {
    const shouldWatchTemplates = !!process.env.WATCH_TEMPLATES === true;
    if (shouldWatchTemplates) {
        debug('Watching templates for changes');
    }

    const templateEnv = nunjucks.configure(['.', 'views'], {
        autoescape: true,
        express: app,
        noCache: true,
        watch: shouldWatchTemplates
    });

    // Add custom view filters
    forEach(viewFilters, (filterFn, filterName) => {
        templateEnv.addFilter(filterName, filterFn);
    });

    app.set('view engine', 'njk').set('engineEnv', templateEnv);
    app.disable('view cache'); // Disable express view cache
}

initViewEngine();

/**
 * Register global middlewares
 */
app.use(timingsMiddleware);
app.use(i18nMiddleware);
app.use(previewMiddleware);
app.use(cached.defaultVary);
app.use(cached.defaultCacheControl);
app.use(loggerMiddleware);
app.use(defaultSecurityHeaders());
app.use(bodyParserMiddleware);
app.use(sessionMiddleware(app));
app.use(passportMiddleware());
app.use(redirectsMiddleware.common);
app.use(localsMiddleware.middleware);
app.use(portalMiddleware);

/**
 * Mount any non-customer-facing controllers
 * Routes mounted here are not translated or localised
 */
app.use('/', require('./controllers/robots'));
app.use('/tools', require('./controllers/tools'));
app.use('/user', require('./controllers/user'));
app.use('/patterns', require('./controllers/pattern-library'));
app.use('/api', require('./controllers/api'));

/**
 * Handle aliases from controllers/aliases
 */
aliases.forEach(alias => {
    app.get(alias.from, (req, res) => {
        res.redirect(301, alias.to);
    });
});

/**
 * Redirect archived paths to the National Archives
 */
// prettier-ignore
const archivedRoutes = [
    '/funding/funding-guidance/applying-for-funding/*',
    '/about-big/10-big-lottery-fund-facts'
]; // prettier-ignore-end
archivedRoutes.forEach(route => {
    app.get(route, cached.noCache, redirectsMiddleware.redirectArchived);
    app.get(makeWelsh(route), cached.noCache, redirectsMiddleware.redirectArchived);
});

/**
 * Initialise sections
 */
forEach(routes.sections, (section, sectionId) => {
    const router = express.Router();

    /**
     * Common middleware
     * - Set sectionId for determining current navigation section
     * - Set sectionTitle and sectionUrl for injecting dynamic breadcrumbs
     */
    router.use((req, res, next) => {
        res.locals.sectionId = sectionId;
        res.locals.sectionTitle = req.i18n.__(`global.nav.${sectionId}`);
        res.locals.sectionUrl = localify(req.i18n.getLocale())(req.baseUrl);
        next();
    });

    const shouldServe = route => (appData.isNotProduction ? true : !route.isDraft);
    section.routes.filter(shouldServe).forEach(route => {
        router.use(route.path, route.router);
    });

    /**
     * Mount section router at both english and welsh language path
     */
    app.use(section.path, router);
    app.use(makeWelsh(section.path), router);
});

/**
 * Error route
 * Alias for error pages for old site -> new
 */
app.get('/error', renderNotFound);

/**
 * Plain text error route
 * Used for more high-level errors
 */
app.get('/error-unauthorised', renderUnauthorised);

/**
 * Final wildcard handler, attempting the following:
 * 1. Check for a matching vanity url defined in the CMS
 * 2. Otherwise, attempy to proxy the page from the legacy website
 * 3. Otherwise, strip /welsh from the url and try again
 *    (for handling 404 requests to monolingual pages)
 * 4. If unsuccessful pass through to the 404 handler.
 */
app.route('*')
    .get(redirectsMiddleware.vanityLookup, proxyPassthrough, redirectsMiddleware.redirectNoWelsh)
    .post(postToLegacyForm);

/**
 * Global 404 Handler
 */
app.use(renderNotFound);

/**
 * Global error handler
 */
app.use(Raven.errorHandler(), (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    renderError(err, req, res);
});
