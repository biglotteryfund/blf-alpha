const Raven = require('raven');
const appData = require('../modules/appData');

function renderUnauthorised(req, res) {
    res.render('unauthorised');
}

function renderNotFound(req, res, err) {
    res.cacheControl = { noStore: true };

    err = err || new Error('Page not found');

    // Set locals, only providing error in development
    res.locals.status = 404;
    res.locals.error = appData.environment ? err : null;
    res.locals.errorTitle = "Sorry, we couldn't find that page / Ni allwn ddod o hyd i'r dudalen hon";
    res.locals.sentry = res.sentry;

    // Render the notfound page
    res.status(res.locals.status);
    res.render('notfound');
}

function renderNotFoundWithError(req, res, err) {
    Raven.captureException(err);
    renderNotFound(req, res, err);
}

function renderError(err, req, res) {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = appData.isDev ? err : null;
    res.locals.status = err.status || 500;
    res.locals.errorTitle = err.friendlyText ? err.friendlyText : 'Error';
    res.locals.sentry = res.sentry;

    // Render the error page
    res.status(res.locals.status);
    res.render('error');
}

function redirectWithError(res, err, redirectTo) {
    Raven.captureException(err);
    res.redirect(redirectTo);
}

module.exports = {
    renderNotFound,
    renderNotFoundWithError,
    renderError,
    redirectWithError,
    renderUnauthorised
};
