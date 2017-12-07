'use strict';
const express = require('express');
const app = (module.exports = express());
const path = require('path');
const config = require('config');
const Raven = require('raven');

const viewEngineService = require('./modules/viewEngine');
const viewGlobalsService = require('./modules/viewGlobals');

const bodyParserMiddleware = require('./middleware/bodyParser');
const cachedMiddleware = require('./middleware/cached');
const loggerMiddleware = require('./middleware/logger');
const passportMiddleware = require('./middleware/passport');
const redirectsMiddleware = require('./middleware/redirects');
const securityHeadersMiddleware = require('./middleware/securityHeaders');
const sessionMiddleware = require('./middleware/session');
const localesMiddleware = require('./middleware/locales');
const favicon = require('serve-favicon');

const getSecret = require('./modules/get-secret');
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

// aka welshify - create an array of paths: default (english) and welsh variant
const cymreigio = mountPath => {
    let welshPath = config.get('i18n.urlPrefix.cy') + mountPath;
    return [mountPath, welshPath];
};

// @TODO: Investigate why this needs to come first to avoid unwanted pageId being injected in route binding below
if (process.env.NODE_ENV !== 'production') {
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
        sectionPaths.forEach(path => {
            // (adding these as an array fails for welsh paths)
            app.use(path, controller);
        });
    }
}

// add vanity redirects
routes.vanityRedirects.forEach(r => {
    let servePath = path => {
        app.get(path, (req, res) => {
            res.redirect(r.destination);
        });
    };
    if (r.paths) {
        r.paths.forEach(path => {
            servePath(path, r.destination);
        });
    } else {
        servePath(r.path, r.destination);
    }
});

const handle404s = () => {
    let err = new Error('Page not found');
    err.status = 404;
    err.friendlyText = "Sorry, we couldn't find that page / Ni allwn ddod o hyd i'r dudalen hon";
    return err;
};

// alias for error pages for old site -> new
app.get('/error', (req, res, next) => {
    next(handle404s());
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(handle404s());
});

if (SENTRY_DSN) {
    app.use(Raven.errorHandler());
}

// error handler
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.status = err.status || 500;
    res.locals.errorTitle = err.friendlyText ? err.friendlyText : 'Error: ' + err.message;
    res.locals.sentry = res.sentry;

    // render the error page
    res.status(res.locals.status);
    res.render('error');
});
