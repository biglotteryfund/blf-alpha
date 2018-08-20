'use strict';
const path = require('path');
const appData = require('../../modules/appData');

function renderNotFound(req, res) {
    res.cacheControl = { noStore: true };

    res.locals.isBilingual = false;
    res.locals.status = 404;
    res.locals.title = "Sorry, we couldn't find that page / Ni allwn ddod o hyd i'r dudalen hon";
    res.locals.sentry = res.sentry;

    res.status(res.locals.status).render(path.resolve(__dirname, './views/error'));
}

function renderError(err, req, res) {
    res.locals.isBilingual = false;
    res.locals.status = err.status || 500;
    res.locals.error = appData.isDev ? err : null;
    res.locals.message = err.message;
    res.locals.title = err.friendlyText ? err.friendlyText : 'Error';
    res.locals.sentry = res.sentry;

    res.status(res.locals.status).render(path.resolve(__dirname, './views/error'));
}

function renderUnauthorised(req, res) {
    res.render(path.resolve(__dirname, './views/unauthorised'));
}

module.exports = {
    renderNotFound,
    renderError,
    renderUnauthorised
};
