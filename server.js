'use strict';
const express = require('express');
const app = (module.exports = express());
const path = require('path');
const config = require('config');
const Raven = require('raven');
const { forEach } = require('lodash');

const viewEngineService = require('./modules/viewEngine');
const viewGlobalsService = require('./modules/viewGlobals');

const bodyParserMiddleware = require('./middleware/bodyParser');
const cachedMiddleware = require('./middleware/cached');
const loggerMiddleware = require('./middleware/logger');
const passportMiddleware = require('./middleware/passport');
const redirectsMiddleware = require('./middleware/redirects');
const securityHeadersMiddleware = require('./middleware/securityHeaders');
const sessionMiddleware = require('./middleware/session');
const i18nMiddleware = require('./middleware/i18n');
const globalsMiddleware = require('./middleware/globals');
const favicon = require('serve-favicon');

const getSecret = require('./modules/get-secret');
const { makeWelsh, cymreigio } = require('./services/locales');
const { renderError, renderNotFound } = require('./controllers/http-errors');
const routes = require('./controllers/routes');

if (app.get('env') === 'development') {
    require('dotenv').config();
}

const SENTRY_DSN = getSecret('sentry.dsn');
if (SENTRY_DSN) {
    Raven.config(SENTRY_DSN, {
        environment: process.env.NODE_ENV || 'development',
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
app.use(cachedMiddleware.defaultVary);
app.use(
    cachedMiddleware.defaultCacheControl({
        defaultMaxAge: config.get('viewCacheExpiration')
    })
);
app.use(
    securityHeadersMiddleware({
        environment: app.get('env')
    })
);
app.use(bodyParserMiddleware);
app.use(sessionMiddleware(app));
app.use(passportMiddleware());
app.use(redirectsMiddleware.all);
app.use(i18nMiddleware(app));
app.use(globalsMiddleware(app));

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
if (process.env.NODE_ENV !== 'production') {
    const applyPath = '/experimental/apply';
    app.use(applyPath, require('./controllers/apply'));
    app.use(cymreigio(applyPath), require('./controllers/apply'));
}

/**
 * Route binding
 */
forEach(routes.sections, (section, sectionId) => {
    if (section.controller) {
        // map the top-level section paths (en/cy) to controllers
        cymreigio(section.path).forEach(sectionPath => {
            const controller = section.controller(section.pages, section.path, sectionId);
            app.use(sectionPath, controller);
        });
    }
});

function serveRedirect({ sourcePath, destinationPath }) {
    app.get(sourcePath, (req, res) => {
        res.redirect(destinationPath);
    });
}

/**
 * Programme Migration Redirects
 */
routes.programmeRedirects.forEach(route => {
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
 * Vanity URL Redirects
 */
routes.vanityRedirects.forEach(route => {
    if (route.paths) {
        route.paths.forEach(routePath => {
            serveRedirect({
                sourcePath: routePath,
                destinationPath: route.destination
            });
        });
    } else {
        serveRedirect({
            sourcePath: route.path,
            destinationPath: route.destination
        });
    }
});

// alias for error pages for old site -> new
app.get('/error', (req, res) => {
    renderNotFound(req, res);
});

// catch 404 and forward to error handler
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
