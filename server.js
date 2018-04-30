'use strict';
const { forEach } = require('lodash');
const express = require('express');
const favicon = require('serve-favicon');
const i18n = require('i18n-2');
const nunjucks = require('nunjucks');
const path = require('path');
const Raven = require('raven');
const yaml = require('js-yaml');

const app = express();
module.exports = app;

const appData = require('./modules/appData');

if (appData.isDev) {
    require('dotenv').config();
}

const { cymreigio } = require('./modules/urls');
const { getSectionsForNavigation } = require('./controllers/route-helpers');
const { proxyPassthrough, postToLegacyForm } = require('./modules/legacy');
const { renderError, renderNotFound, renderUnauthorised } = require('./controllers/http-errors');
const { SENTRY_DSN } = require('./modules/secrets');
const { serveRedirects } = require('./modules/redirects');
const { shouldServe } = require('./modules/pageLogic');
const routes = require('./controllers/routes');
const viewFilters = require('./modules/filters');
const viewGlobalsService = require('./modules/viewGlobals');

const { defaultSecurityHeaders, stripCSPHeader } = require('./middleware/securityHeaders');
const { noCache } = require('./middleware/cached');
const bodyParserMiddleware = require('./middleware/bodyParser');
const cachedMiddleware = require('./middleware/cached');
const i18nMiddleware = require('./middleware/i18n');
const localsMiddleware = require('./middleware/locals');
const loggerMiddleware = require('./middleware/logger');
const passportMiddleware = require('./middleware/passport');
const previewMiddleware = require('./middleware/preview');
const redirectsMiddleware = require('./middleware/redirects');
const sessionMiddleware = require('./middleware/session');
const timingsMiddleware = require('./middleware/timings');

/**
 * Configure Sentry client
 * @see https://docs.sentry.io/clients/node/config/
 */
Raven.config(SENTRY_DSN, {
    environment: appData.environment,
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
 * Status endpoint
 * Mount early to avoid being processed by any middleware
 */
app.get('/status', require('./controllers/toplevel/status'));

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
     * Is this page bilingual?
     * i.e. do we have a Welsh translation
     * Default to true unless overriden by a route
     */
    app.locals.isBilingual = true;

    /**
     * Navigation sections for top-level nav
     */
    app.locals.navigationSections = getSectionsForNavigation();
}

initAppLocals();

/**
 * Configure views
 * 1. Configure Nunjucks
 * 2. Add custom filters
 * 3. Add custom view globals
 */
function initViewEngine() {
    const templateEnv = nunjucks.configure('views', {
        autoescape: true,
        express: app,
        noCache: appData.isDev,
        watch: appData.isDev
    });

    forEach(viewFilters, (filterFn, filterName) => {
        templateEnv.addFilter(filterName, filterFn);
    });

    app.set('view engine', 'njk').set('engineEnv', templateEnv);

    viewGlobalsService.init(app);
}

initViewEngine();

/**
 * Register global middlewares
 */
app.use(timingsMiddleware);
app.use(i18nMiddleware);
app.use(cachedMiddleware.defaults);
app.use(loggerMiddleware);
app.use(defaultSecurityHeaders());
app.use(bodyParserMiddleware);
app.use(sessionMiddleware(app));
app.use(passportMiddleware());
app.use(redirectsMiddleware.common);
app.use(localsMiddleware);
app.use(previewMiddleware);

// Mount tools controller
app.use('/tools', require('./controllers/tools'));

// Mount apply controller (forms)
app.use(cymreigio('/apply'), require('./controllers/apply'));

// Mount user auth controller
app.use('/user', require('./controllers/user'));

/**
 * Section routes
 * Initialise core application routes
 */
forEach(routes.sections, (section, sectionId) => {
    if (section.controller) {
        const controller = section.controller(section.pages, section.path, sectionId);
        cymreigio(section.path).forEach(urlPath => {
            app.use(urlPath, controller);
        });
    }
});

/**
 * Legacy Redirects
 * Redirecy legacy URLs to new locations
 * For these URLs handle both english and welsh variants
 */
serveRedirects({
    redirects: routes.legacyRedirects.filter(shouldServe),
    makeBilingual: true
});

/**
 * Vanity URLs
 * Sharable short-urls redirected to canonical URLs.
 */
serveRedirects({
    redirects: routes.vanityRedirects.filter(shouldServe)
});

/**
 * Archived Routes
 * Redirect to the National Archvies
 */
routes.archivedRoutes.filter(shouldServe).forEach(route => {
    app.get(cymreigio(route.path), noCache, redirectsMiddleware.redirectArchived);
});

/**
 * Error route
 * Alias for error pages for old site -> new
 */
app.get('/error', (req, res) => {
    renderNotFound(req, res);
});

/**
 * Plain text error route
 * Used for more high-level errors
 */
app.get('/error-unauthorised', (req, res) => {
    renderUnauthorised(req, res);
});

/**
 * Final wildcard request handled
 * Attempt to proxy pages from the legacy site,
 * if unsuccessful pass through to the 404 handler.
 */
app
    .route('*')
    .all(stripCSPHeader)
    .get(proxyPassthrough, redirectsMiddleware.redirectNoWelsh)
    .post(postToLegacyForm);

/**
 * 404 Handler
 * Catch 404s render not found page
 */
app.use((req, res) => {
    renderNotFound(req, res);
});

/**
 * Global error handler
 */
app.use(Raven.errorHandler(), (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    renderError(err, req, res);
});
