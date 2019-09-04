'use strict';
const path = require('path');
const config = require('config');
const express = require('express');
const moment = require('moment');
const i18n = require('i18n-2');
const yaml = require('js-yaml');
const nunjucks = require('nunjucks');
const cacheControl = require('express-cache-controller');
const favicon = require('serve-favicon');
const helmet = require('helmet');
const slashes = require('connect-slashes');
const vary = require('vary');
const Sentry = require('@sentry/node');
const forEach = require('lodash/forEach');

const features = config.get('features');

const app = express();
module.exports = app;

const appData = require('./common/appData');
const logger = require('./common/logger').child({ service: 'server' });

if (appData.isDev) {
    require('dotenv').config();
}

const {
    isWelsh,
    localify,
    makeWelsh,
    pathCouldBeAlias,
    removeWelsh
} = require('./common/urls');
const { SENTRY_DSN } = require('./common/secrets');
const aliases = require('./controllers/aliases');
const routes = require('./controllers/routes');
const viewFilters = require('./common/filters');
const cspDirectives = require('./common/csp-directives');
const contentApi = require('./common/content-api');
const { defaultMaxAge } = require('./common/cached');
const passportMiddleware = require('./common/passport');
const sessionMiddleware = require('./middleware/session');

const { renderError, renderNotFound } = require('./controllers/errors');

/**
 * Configure Sentry client
 * @see https://docs.sentry.io/platforms/node/express/
 */
Sentry.init({
    dsn: SENTRY_DSN,
    logger: 'server',
    environment: appData.environment,
    release: `tnlcf-web-${appData.commitId}`,
    beforeSend: function(event) {
        // Clear all POST data
        delete event.request.data;
        return event;
    }
});

/**
 * The Sentry request handler must be the first middleware
 */
app.use(Sentry.Handlers.requestHandler());

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
 * Old domain redirect
 * Redirect requests from www.biglotteryfund.org.uk
 */
app.use(require('./controllers/domain-redirect'));

/**
 * Status endpoint
 * Mount first
 */
const LAUNCH_DATE = moment();
app.get('/status', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.setHeader('Cache-Control', 'no-store,no-cache,max-age=0');

    res.json({
        APP_ENV: appData.environment,
        DEPLOY_ID: appData.deployId,
        COMMIT_ID: appData.commitId,
        BUILD_NUMBER: appData.buildNumber,
        START_DATE: LAUNCH_DATE.format('dddd, MMMM Do YYYY, h:mm:ss a'),
        UPTIME: LAUNCH_DATE.toNow(true)
    });
});

/**
 * Robots.txt
 */
app.use('/robots.txt', require('./controllers/robots'));

/**
 * Site-map
 */
app.use('/sitemap.xml', require('./controllers/sitemap'));

/**
 * Static asset paths
 * Mount early to avoid being processed by any middleware
 * @see https://expressjs.com/en/4x/api.html#express.static
 */
app.use(favicon(path.join('public', '/favicon.ico')));
app.use('/assets', express.static(path.join(__dirname, './public')));

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
        logger.debug('Watching templates for changes');
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
 * Register global middleware
 */
app.use([
    slashes(false),
    (req, res, next) => {
        vary(res, 'Cookie');
        next();
    },
    cacheControl(),
    defaultMaxAge,
    helmet({
        contentSecurityPolicy: {
            directives: cspDirectives({
                enableHotjar: features.enableHotjar,
                allowLocalhost: features.enableAllowLocalhost
            }),
            browserSniff: false
        },
        dnsPrefetchControl: { allow: true },
        frameguard: { action: 'sameorigin' },
        permittedCrossDomainPolicies: {
            permittedPolicies: 'none'
        },
        referrerPolicy: {
            policy: 'no-referrer-when-downgrade'
        },
        featurePolicy: {
            features: {
                fullscreen: ["'self'"],
                payment: ["'none'"]
            }
        }
    }),
    express.json(),
    express.urlencoded({ extended: true }),
    sessionMiddleware(app),
    passportMiddleware(),
    require('./common/locals'),
    require('./common/preview')
]);

/**
 * Mount utility routes
 */
app.use('/api', require('./controllers/api'));
app.use('/tools', require('./controllers/tools'));
app.use('/patterns', require('./controllers/pattern-library'));

/**
 * Handle Aliases
 */

aliases.forEach(redirect => {
    app.get(redirect.from, (req, res) => res.redirect(301, redirect.to));
});

/**
 * Handle legacy programme pages as wildcards
 * (eg. redirect them to /funding/programmes/<slug>)
 */
app.get('/:region?/global-content/programmes/:country/:slug', (req, res) => {
    const locale = req.params.region === 'welsh' ? '/welsh' : '';
    res.redirect(301, `${locale}/funding/programmes/${req.params.slug}`);
});

/**
 * Archived paths
 * Handles archived pages (eg. redirect to National Archives)
 * and legacy files (eg. show a message about removed documents)
 */
app.use('/', require('./controllers/archived'));

/**
 * Initialise section routes
 * - Creates a new router for each section
 * - Apply shared middleware
 * - Apply section specific controller logic
 * - Add common routing (for static/fully-CMS powered pages)
 */
forEach(routes, function(section, sectionId) {
    const router = express.Router();

    /**
     * Add section locals
     * Used for determining top-level section for navigation and breadcrumbs
     */
    router.use(function(req, res, next) {
        res.locals.sectionTitle = req.i18n.__(`global.nav.${sectionId}`);
        res.locals.sectionUrl = localify(req.i18n.getLocale())(req.baseUrl);
        next();
    });

    /**
     * Mount page router
     */
    section.pages.forEach(function(page) {
        router.use(page.path, page.router);
    });

    /**
     * Mount section router
     */
    app.use(section.path, router);
    app.use(makeWelsh(section.path), router);
});

/**
 * Final wildcard request handler
 * - Lookup vanity URL and redirect if we have a match
 * - Otherwise, if the URL is welsh strip that from the URL and try again
 * - If all else fails, pass through to the 404 handler.
 */
app.route('*').get(
    async function(req, res, next) {
        if (pathCouldBeAlias(req.path)) {
            try {
                const urlMatch = await contentApi.getAlias(req.path);
                if (urlMatch) {
                    res.redirect(301, urlMatch);
                } else {
                    next();
                }
            } catch (e) {
                next();
            }
        } else {
            next();
        }
    },
    function(req, res, next) {
        if (isWelsh(req.originalUrl)) {
            res.redirect(removeWelsh(req.originalUrl));
        } else {
            next();
        }
    }
);

/**
 * 404 Handler
 * Catch 404s render not found page
 */
app.use(renderNotFound);

/**
 * Global error handler
 */
app.use(Sentry.Handlers.errorHandler(), function(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    renderError(err, req, res);
});
