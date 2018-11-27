'use strict';
const config = require('config');

const appData = require('../modules/appData');
const { REBRAND_SECRET } = require('../modules/secrets');
const { requireStaffAuth } = require('./authed');

const cookies = config.get('cookies');

/**
 * Staff authed rebrand flag
 */
module.exports = (req, res, next) => {
    if (
        appData.isNotProduction &&
        req.cookies[cookies.rebrand] === REBRAND_SECRET &&
        req.path.indexOf('/user/staff') === -1
    ) {
        res.locals.featureUseNewBrand = true;
        requireStaffAuth(req, res, next);
    } else {
        next();
    }
};
