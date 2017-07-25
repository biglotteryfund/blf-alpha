'use strict';
const express = require('express');
const app = module.exports = express();
const config = require('config');

// load app routing list
const routes = require('./routes/routes');

// configure boilerplate
require('./modules/boilerplate/viewEngine');
require('./modules/boilerplate/globals');
require('./modules/boilerplate/security');
require('./modules/boilerplate/static');
require('./modules/boilerplate/cache');
require('./modules/boilerplate/middleware');
require('./modules/boilerplate/getSurveys');

// load tools endpoint (including status page for load balancer)
app.use('/', require('./routes/toplevel/tools'));

// aka welshify - create an array of paths: default (english) and welsh variant
const cymreigio = function (mountPath) {
    let welshPath = config.get('i18n.urlPrefix.cy') + mountPath;
    return [mountPath, welshPath];
};

// route binding
for (let section in routes.sections) {
    let s = routes.sections[section];
    // turn /funding into /welsh/funding
    let paths = cymreigio(s.path);
    // create route handlers for each page path
    let handler = s.handler(s.pages);
    // map the top-level section paths (en/cy) to handlers
    paths.forEach(path => {
        // (adding these as an array fails for welsh paths)
        app.use(path, handler);
    });
}

// add vanity redirects
routes.vanityRedirects.forEach(r => {
    let servePath = (path, destination) => {
        app.get(path, (req, res, next) => {
            res.redirect(r.destination);
        });
    };
    if (r.paths) {
        r.paths.forEach((path) => {
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

// error handler
app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.locals.status = err.status || 500;
    res.locals.errorTitle = (err.friendlyText) ? err.friendlyText : 'Error: ' + err.message;

    // render the error page
    res.status(res.locals.status);
    res.render('error');
});