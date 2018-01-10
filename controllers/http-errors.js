const Raven = require('raven');
const appData = require('../modules/appData');

function renderNotFound(req, res) {
    let err = new Error('Page not found');
    err.status = 404;
    err.friendlyText =
        "Sorry, we couldn't find that page / Ni allwn ddod o hyd i'r dudalen hon";

    res.locals.message = err.message;
    res.locals.status = 404;
    res.locals.errorTitle = err.friendlyText
        ? err.friendlyText
        : 'Error: ' + err.message;

    // Render the error page
    res.status(res.locals.status);
    res.render('notfound');
}

function renderNotFoundWithError(err, req, res) {
    Raven.captureException(err);
    renderNotFound(req, res);
}

function renderError(err, req, res) {
    // Set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = appData.isDev ? err : {};
    res.locals.status = err.status || 500;
    res.locals.errorTitle = err.friendlyText
        ? err.friendlyText
        : 'Error: ' + err.message;
    res.locals.sentry = res.sentry;

    // Render the error page
    res.status(res.locals.status);
    res.render('error');
}

module.exports = {
    renderNotFound,
    renderNotFoundWithError,
    renderError
};
