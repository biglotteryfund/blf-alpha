'use strict';

const Raven = require('raven');
const appData = require('../modules/appData');

function renderUnauthorised(req, res) {
    res.render('unauthorised');
}

function renderNotFound(req, res, err = null) {
    res.cacheControl = { noStore: true };

    res.locals.isBilingual = false;
    res.locals.status = 404;
    res.locals.error = err;
    res.locals.title = "Sorry, we couldn't find that page / Ni allwn ddod o hyd i'r dudalen hon";
    res.locals.sentry = res.sentry;

    res.status(res.locals.status);
    res.render('error');
}

function renderNotFoundWithError(req, res, err) {
    Raven.captureException(err);
    renderNotFound(req, res, err);
}

function renderError(err, req, res) {
    res.locals.isBilingual = false;
    res.locals.status = err.status || 500;
    res.locals.error = appData.isDev ? err : null;
    res.locals.message = err.message;
    res.locals.title = err.friendlyText ? err.friendlyText : 'Error';
    res.locals.sentry = res.sentry;

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
