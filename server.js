'use strict';
const express = require('express');
const app = module.exports = express();
const config = require('config');
const routes = require('./routes/routes');

// configure boilerplate
require('./boilerplate/viewEngine');
require('./boilerplate/globals');
require('./boilerplate/security');
require('./boilerplate/static');
require('./boilerplate/cache');
require('./boilerplate/middleware');

// create status endpoint (used by load balancer)
app.use('/status', require('./routes/status'));

// aka welshify - create an array of paths: default (english) and welsh variant
const cymreigio = function (mountPath) {
    let welshPath = config.get('i18n.urlPrefix.cy') + mountPath;
    return [mountPath, welshPath];
};

// route binding

// homepage couldn't be welshified :(
const homepage = require('./routes/index');
app.use('/', homepage);
app.use('/welsh', homepage);

// all other routes
for (let section in routes.sections) {
    let s = routes.sections[section];
    app.use(cymreigio(s.path), s.handler(s.pages));
}

// add vanity redirects
routes.vanityRedirects.forEach(r => {
    app.get(r.path, (req, res, next) => {
        res.redirect(r.destination);
    });
});

const handle404s = () => {
    let err = new Error('Page not found');
    err.status = 404;
    err.friendlyText = "Sorry, we couldn't find that page";
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