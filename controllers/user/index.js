'use strict';
const express = require('express');
const { get } = require('lodash');

const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

const router = express.Router();

router.use('/staff', require('./staff'));

router.use(noCache, noindex);

function isStaff(user) {
    return get(user, 'userType', false) === 'staff';
}

router.use(function(req, res, next) {
    if (req.isAuthenticated() && isStaff(req.user)) {
        res.redirect('/tools');
    } else {
        res.locals.bodyClass = 'has-static-header'; // No hero images on user pages
        res.locals.sectionTitle = req.i18n.__('user.common.yourAccount');
        res.locals.sectionUrl = req.baseUrl;

        if (req.user) {
            res.locals.user = req.user;
        }

        next();
    }
});

router.use('/', require('./dashboard'));
router.use('/login', require('./login'));
router.use('/register', require('./register'));
router.use('/logout', require('./logout'));
router.use('/activate', require('./activate'));
router.use('/password', require('./password'));

module.exports = router;
