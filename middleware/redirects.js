'use strict';

function redirectNonWww(req, res, next) {
    let host = req.headers.host;
    let domainProd = 'biglotteryfund.org.uk';
    if (host === domainProd) {
        return res.redirect(301, req.protocol + '://www.' + domainProd + req.originalUrl);
    } else {
        return next();
    }
}

module.exports = [redirectNonWww];
