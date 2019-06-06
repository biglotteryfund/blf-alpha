'use strict';
const express = require('express');
const { get } = require('lodash');

const { redirectForLocale } = require('../../common/urls');
const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

const router = express.Router();

router.use(noCache, noindex);

router.use('/staff', require('./staff'));

function isStaff(user) {
    return get(user, 'userType', false) === 'staff';
}

router.use(function(req, res, next) {
    /**
     * Block access to common /user routes if staff
     * only allow access to staff routes.
     */
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
router.use('/activate', require('./activate'));
router.use('/password', require('./password'));
router.use('/update-email', require('./update-email'));

router.get('/logout', function(req) {
    req.logout();
    req.session.save(() => {
        redirectForLocale(req, res, '/user/login?s=loggedOut');
    });
});

module.exports = router;
