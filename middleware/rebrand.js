'use strict';
const config = require('config');

const appData = require('../modules/appData');
const { REBRAND_SECRET } = require('../modules/secrets');

const cookies = config.get('cookies');

/**
 * Staff authed rebrand flag
 */
module.exports = (req, res, next) => {
    if (appData.isNotProduction && req.cookies[cookies.rebrand] === REBRAND_SECRET) {
        res.cacheControl = { noStore: true };
        res.locals.featureUseNewBrand = true;
    }

    next();
};
