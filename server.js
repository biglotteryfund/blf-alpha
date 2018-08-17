'use strict';
const { forEach } = require('lodash');
const config = require('config');
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
const { getSectionsForNavigation } = require('./controllers/helpers/route-helpers');
const { heroImages } = require('./modules/images');
const { proxyPassthrough, postToLegacyForm } = require('./modules/legacy');
const { renderError, renderNotFound, renderUnauthorised } = require('./controllers/http-errors');
const { SENTRY_DSN } = require('./modules/secrets');
const { shouldServe } = require('./modules/pageLogic');
const routeCommon = require('./controllers/common');
const routes = require('./controllers/routes');
const formHelpers = require('./modules/forms');
const viewFilters = require('./modules/filters');

const { defaults: cachedMiddleware, sMaxAge } = require('./middleware/cached');
const { defaultSecurityHeaders, stripCSPHeader } = require('./middleware/securityHeaders');
const { injectCopy, injectHeroImage } = require('./middleware/inject-content');
const { noCache } = require('./middleware/cached');
const bodyParserMiddleware = require('./middleware/bodyParser');
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
     * Navigation sections for top-level nav
     */
    app.locals.navigationSections = getSectionsForNavigation();

    /**
     * Common hero images
     */
    app.locals.heroImages = heroImages;

    /**
     * Default pageAccent colour
     */
    app.locals.pageAccent = 'pink';

    /**
     * Form helpers
     */
    app.locals.formHelpers = formHelpers;
}

initAppLocals();

/**
 * Configure views
 * 1. Configure Nunjucks
 * 2. Add custom filters
 * 3. Add custom view globals
 */
function initViewEngine() {
    const templateEnv = nunjucks.configure(['.', 'views'], {
        autoescape: true,
        express: app,
        noCache: appData.isDev,
        // only watch files if we explicitly request
        // (eg. for CI, which tries to watch node_modules)
        watch: process.env.WATCH_TEMPLATES === true
    });

    forEach(viewFilters, (filterFn, filterName) => {
        templateEnv.addFilter(filterName, filterFn);
    });

    app.set('view engine', 'njk').set('engineEnv', templateEnv);
    // attempt to fix session sharing bug
    // see https://stackoverflow.com/questions/32307933/passportjs-session-mixed-up
    app.disable('view cache');
}

initViewEngine();

/**
 * Register global middlewares
 */
app.use(timingsMiddleware);
app.use(i18nMiddleware);
app.use(previewMiddleware);
app.use(cachedMiddleware);
app.use(loggerMiddleware);
app.use(defaultSecurityHeaders());
app.use(bodyParserMiddleware);
app.use(sessionMiddleware(app));
app.use(passportMiddleware());
app.use(redirectsMiddleware.common);
app.use(localsMiddleware.middleware);
app.use(portalMiddleware);

// Mount tools controller
app.use('/tools', require('./controllers/tools'));

// Mount user auth controller
app.use('/user', require('./controllers/user'));

/**
 * Handle Aliases
 */
routes.aliases.forEach(redirect => {
    app.get(redirect.from, (req, res) => {
        res.redirect(301, redirect.to);
    });
});

/**
 * Archived Routes
 * Redirect to the National Archives
 */
routes.archivedRoutes.filter(shouldServe).forEach(route => {
    app.get(cymreigio(route.path), noCache, redirectsMiddleware.redirectArchived);
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
     * Middleware to add a section ID to requests with a known section
     * (eg. to mark a section as current in the nav)
     */
    router.use(function(req, res, next) {
        res.locals.sectionId = sectionId;
        next();
    });

    /**
     * Page specific middleware
     */
    forEach(section.pages, (page, pageId) => {
        router
            .route(page.path)
            .all(injectCopy(page), injectHeroImage(page.heroSlug), (req, res, next) => {
                res.locals.pageId = pageId;
                next();
            })
            .get(sMaxAge(page.sMaxAge));
    });

    /**
     * Apply section specific controller logic
     */
    if (section.controller) {
        router = section.controller({
            router: router,
            pages: section.pages,
            sectionPath: section.path,
            sectionId: sectionId
        });
    }

    /**
     * Add common routing (for static/fully-CMS powered pages)
     */
    router = routeCommon.init({
        router: router,
        pages: section.pages
    });

    /**
     * Mount section router
     */
    cymreigio(section.path).forEach(urlPath => {
        app.use(urlPath, router);
    });
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
app.route('*')
    .all(stripCSPHeader)
    .get(redirectsMiddleware.vanityLookup, proxyPassthrough, redirectsMiddleware.redirectNoWelsh)
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
