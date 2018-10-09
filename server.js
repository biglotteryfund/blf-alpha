'use strict';
const { forEach, flatMap } = require('lodash');
const config = require('config');
const express = require('express');
const favicon = require('serve-favicon');
const i18n = require('i18n-2');
const nunjucks = require('nunjucks');
const path = require('path');
const Raven = require('raven');
const slashes = require('connect-slashes');
const yaml = require('js-yaml');
const debug = require('debug')('biglotteryfund:server');

const app = express();
module.exports = app;

const appData = require('./modules/appData');

if (appData.isDev) {
    require('dotenv').config();
}

const { isWelsh, makeWelsh, removeWelsh, localify } = require('./modules/urls');
const { proxyPassthrough, postToLegacyForm } = require('./modules/legacy');
const { renderError, renderNotFound, renderUnauthorised } = require('./controllers/errors');
const { SENTRY_DSN } = require('./modules/secrets');
const aliases = require('./controllers/aliases');
const routes = require('./controllers/routes');
const viewFilters = require('./modules/filters');

const { defaultSecurityHeaders } = require('./middleware/securityHeaders');
const { injectCopy, injectHeroImage } = require('./middleware/inject-content');
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
const vanityMiddleware = require('./middleware/vanity');

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
        // Clear installed node_modules
        delete data.modules;
        // Clear POST data
        delete data.request.data;

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
 * Robots
 * status endpoint, sitemap, robots.txt
 * Mount early to avoid being processed by any middleware
 */
app.use('/', require('./controllers/robots'));

/**
 * Static asset paths
 * Mount early to avoid being processed by any middleware
 * @see https://expressjs.com/en/4x/api.html#express.static
 */
app.use(favicon(path.join('public', '/favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, './public')));

/**
 * Define common app locals
 * @see https://expressjs.com/en/api.html#app.locals
 */
function initAppLocals() {
    /**
     * Environment metadata
     */
    app.locals.appData = appData;

    /**
     * Common date formats
     */
    app.locals.DATE_FORMATS = config.get('dateFormats');

    /**
     * Is this page bilingual?
     * i.e. do we have a Welsh translation
     * Default to true unless overridden by a route
     */
    app.locals.isBilingual = true;

    /**
     * Default pageAccent colour
     */
    app.locals.pageAccent = 'pink';
}

initAppLocals();

/**
 * Configure views
 * 1. Configure Nunjucks
 * 2. Add custom filters
 * 3. Add custom view globals
 */
function initViewEngine() {
    /**
     * Only watch files if we explicitly request
     * (eg. for CI, which tries to watch node_modules)
     */
    const shouldWatchTemplates = !!process.env.WATCH_TEMPLATES === true;
    if (shouldWatchTemplates) {
        debug('Watching templates for changes');
    }

    const templateEnv = nunjucks.configure(['.', 'views'], {
        autoescape: true,
        express: app,
        noCache: true, // Disable nunjucks memory cache
        watch: shouldWatchTemplates
    });

    forEach(viewFilters, (filterFn, filterName) => {
        templateEnv.addFilter(filterName, filterFn);
    });

    app.set('view engine', 'njk').set('engineEnv', templateEnv);

    // Disable express  view cache
    app.disable('view cache');
}

initViewEngine();

/**
 * Register global middlewares
 */
app.use(slashes(false));
app.use(redirectsMiddleware);
app.use(timingsMiddleware);
app.use(i18nMiddleware);
app.use(cached.defaultVary);
app.use(cached.defaultCacheControl);
app.use(loggerMiddleware);
app.use(defaultSecurityHeaders());
app.use(bodyParserMiddleware);
app.use(sessionMiddleware(app));
app.use(passportMiddleware());
app.use(localsMiddleware.middleware);
app.use(previewMiddleware);
app.use(portalMiddleware);

/**
 * Mount utility routes
 */
app.use('/api', require('./controllers/api'));
app.use('/user', require('./controllers/user'));
app.use('/tools', require('./controllers/tools'));
app.use('/patterns', require('./controllers/pattern-library'));

/**
 * Handle Aliases
 */
aliases.forEach(redirect => {
    app.get(redirect.from, (req, res) => res.redirect(301, redirect.to));
});

/**
 * Archived Routes
 * Paths in this array will be redirected to the National Archives.
 * We show an interstitial page a) to let people know the page has been archived
 * and b) to allow us to record the redirect as a pageview using standard analytics behaviour.
 */
// prettier-ignore
flatMap([
    '/about-big/10-big-lottery-fund-facts',
    '/funding/funding-guidance/applying-for-funding/*'
], urlPath => [urlPath, makeWelsh(urlPath)]).forEach(urlPath => {
    app.get(urlPath, cached.noCache, function(req, res) {
        const fullUrl = `https://${config.get('siteDomain')}${req.originalUrl}`;
        const archiveUrl = `http://webarchive.nationalarchives.gov.uk/${fullUrl}`;
        res.render('static-pages/archived', {
            title: 'Archived',
            archiveUrl: archiveUrl
        });
    });
});

/**
 * Initialise section routes
 * - Creates a new router for each section
 * - Apply shared middleware
 * - Apply section specific controller logic
 * - Add common routing (for static/fully-CMS powered pages)
 */
forEach(routes.sections, (section, sectionId) => {
    let router = express.Router();

    /**
     * Add section locals
     * Used for determining top-level section for navigation and breadcrumbs
     */
    router.use(function(req, res, next) {
        const locale = req.i18n.getLocale();
        res.locals.sectionId = sectionId;
        res.locals.sectionTitle = req.i18n.__(`global.nav.${sectionId}`);
        res.locals.sectionUrl = localify(locale)(req.baseUrl);
        next();
    });

    /**
     * Page-level logic
     * Apply page level middleware and mount router if we have one
     */
    forEach(section.pages, (page, pageId) => {
        router.route(page.path).all(injectCopy(page.lang), injectHeroImage(page.heroSlug), (req, res, next) => {
            res.locals.pageId = pageId;
            next();
        });

        const shouldServe = appData.isNotProduction ? true : !page.isDraft;
        if (shouldServe && page.router) {
            router.use(page.path, page.router);
        }
    });

    /**
     * Mount section router
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
 * Final wildcard request handler
 * - Lookup vanity URLs and redirect if any match
 * - Attempt to proxy pages from the legacy site
 * - Othewise, if the URL is welsh strip that from the URL and try again
 * - If all else fails, pass through to the 404 handler.
 */
app.route('*')
    .get(vanityMiddleware, proxyPassthrough, function(req, res, next) {
        if (isWelsh(req.originalUrl)) {
            res.redirect(removeWelsh(req.originalUrl));
        } else {
            next();
        }
    })
    .post(postToLegacyForm);

/**
 * 404 Handler
 * Catch 404s render not found page
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
