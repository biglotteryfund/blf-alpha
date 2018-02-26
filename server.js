'use strict';
const express = require('express');
const app = (module.exports = express());
const path = require('path');
const config = require('config');
const Raven = require('raven');

const appData = require('./modules/appData');
if (appData.isDev) {
    require('dotenv').config();
}

const { SENTRY_DSN } = require('./modules/secrets');
const { cymreigio, makeWelsh } = require('./modules/urls');
const viewEngineService = require('./modules/viewEngine');
const viewGlobalsService = require('./modules/viewGlobals');
const { shouldServe } = require('./modules/pageLogic');
const { proxyPassthrough, postToLegacyForm, redirectUglyLink } = require('./modules/legacy');
const { renderError, renderNotFound, renderUnauthorised } = require('./controllers/http-errors');
const { redirectArchived, redirectNoWelsh } = require('./modules/redirects');
const routes = require('./controllers/routes');

const favicon = require('serve-favicon');
const bodyParserMiddleware = require('./middleware/bodyParser');
const cachedMiddleware = require('./middleware/cached');
const loggerMiddleware = require('./middleware/logger');
const passportMiddleware = require('./middleware/passport');
const redirectsMiddleware = require('./middleware/redirects');
const { defaultSecurityHeaders, stripCSPHeader } = require('./middleware/securityHeaders');
const sessionMiddleware = require('./middleware/session');
const localesMiddleware = require('./middleware/locales');
const { noCache } = require('./middleware/cached');
const previewMiddleware = require('./middleware/preview');

if (SENTRY_DSN) {
    Raven.config(SENTRY_DSN, {
        environment: appData.environment,
        dataCallback(data) {
            delete data.modules;
            // clear out POST data
            delete data.request.data;
            return data;
        }
    }).install();
    app.use(Raven.requestHandler());
}

// Configure views
viewEngineService.init(app);
viewGlobalsService.init(app);

// Add global middlewares
app.use(loggerMiddleware);
app.use(previewMiddleware);
app.use(cachedMiddleware.defaultVary);
app.use(cachedMiddleware.defaultCacheControl);
app.use(defaultSecurityHeaders());
app.use(bodyParserMiddleware);
app.use(sessionMiddleware(app));
app.use(passportMiddleware());
app.use(redirectsMiddleware.all);
app.use(localesMiddleware(app));

// Configure static files
app.use(favicon(path.join('public', '/favicon.ico')));
app.use(
    `/${config.get('assetVirtualDir')}`,
    express.static(path.join(__dirname, './public'), {
        maxAge: config.get('staticExpiration')
    })
);

// load tools endpoint (including status page for load balancer)
app.use('/', require('./controllers/toplevel/tools'));

// map user auth controller
app.use('/user', require('./controllers/user/index'));

// @TODO: Investigate why this needs to come first to avoid unwanted pageId being injected in route binding below
if (appData.isNotProduction) {
    const applyPath = '/experimental/apply';
    app.use(applyPath, require('./controllers/apply'));
    app.use(cymreigio(applyPath), require('./controllers/apply'));
}

// route binding
for (let sectionId in routes.sections) {
    let s = routes.sections[sectionId];
    // turn '/funding' into ['/funding', '/welsh/funding']
    let sectionPaths = cymreigio(s.path);
    // init route controller for each page path
    if (s.controller) {
        let controller = s.controller(s.pages, s.path, sectionId);
        // map the top-level section paths (en/cy) to controllers
        sectionPaths.forEach(urlPath => {
            // (adding these as an array fails for welsh paths)
            app.use(urlPath, controller);
        });
    }
}

function serveRedirect({ sourcePath, destinationPath }) {
    app.get(sourcePath, (req, res) => {
        res.redirect(301, destinationPath);
    });
}

/**
 * Legacy Redirects
 * Redirecy legacy URLs to new locations
 * For these URLs handle both english and welsh variants
 */
routes.legacyRedirects.filter(shouldServe).forEach(route => {
    serveRedirect({
        sourcePath: route.path,
        destinationPath: route.destination
    });
    serveRedirect({
        sourcePath: makeWelsh(route.path),
        destinationPath: makeWelsh(route.destination)
    });
});

/**
 * Vanity URLs
 * Sharable short-urls redirected to canonical URLs.
 */
routes.vanityRedirects.filter(shouldServe).forEach(route => {
    serveRedirect({
        sourcePath: route.path,
        destinationPath: route.destination
    });
});

/**
 * Archived Routes
 * Redirect to the National Archvies
 */
routes.archivedRoutes.filter(shouldServe).forEach(route => {
    app.get(route.path, noCache, redirectArchived);
    app.get(makeWelsh(route.path), noCache, redirectArchived);
});

/**
 * Sitecore links
 * Redirect all bad link aliases to their canonical equivalents
 */
app.get('*~/link.aspx', redirectUglyLink);

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
    .get(redirectNoWelsh, proxyPassthrough)
    .post(postToLegacyForm);

/**
 * 404 Handler
 * Catch 404s render not found page
 */
app.use((req, res) => {
    renderNotFound(req, res);
});

if (SENTRY_DSN) {
    app.use(Raven.errorHandler());
}

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    renderError(err, req, res);
});
