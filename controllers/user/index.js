'use strict';
const express = require('express');
const uuidv4 = require('uuid/v4');
const features = require('config').get('features');

const { Users } = require('../../db/models');
const { localify, redirectForLocale } = require('../../common/urls');
const { noCache } = require('../../middleware/cached');
const { requireNotStaffAuth } = require('../../middleware/authed');

const router = express.Router();

router.use(noCache, function(req, res, next) {
    res.setHeader('X-Robots-Tag', 'noindex');
    res.locals.isBilingual = false;
    next();
});

/**
 * Staff auth
 * Azure Active Directory authentication for staff members
 */
router.use('/staff', require('./staff'));

/**
 * User seed endpoint
 * Allows generation of seed users in test environments
 * Seed users have isActive automatically set as true
 * to bypass activation flow in tests.
 */
if (features.enableSeeders) {
    router.post('/seed', (req, res) => {
        const username = `${uuidv4()}@example.com`;
        const password = uuidv4();

        Users.createUser({
            username: username,
            password: password,
            isActive: true
        }).then(() => {
            res.json({ username, password });
        });
    });
}

/**
 * Public user routes
 * Disallow staff from this point on
 */
router.use(requireNotStaffAuth, function(req, res, next) {
    res.locals.bodyClass = 'has-static-header'; // No hero images on user pages
    res.locals.sectionTitle = req.i18n.__('user.common.yourAccount');
    res.locals.sectionUrl = req.baseUrl;

    if (req.user) {
        res.locals.user = req.user;

        res.locals.userNavigationLinks = [
            {
                url: localify(req.i18n.getLocale())('/apply/awards-for-all'),
                label: 'Applications'
            },
            {
                url: localify(req.i18n.getLocale())('/user'),
                label: 'Account'
            },
            {
                url: localify(req.i18n.getLocale())('/user/logout'),
                label: 'Log out'
            }
        ];
    }

    next();
});

router.use('/', require('./dashboard'));
router.use('/login', require('./login'));
router.use('/register', require('./register'));
router.use('/activate', require('./activate'));
router.use('/password', require('./password'));
router.use('/update-email', require('./update-email'));

router.get('/logout', function(req, res) {
    req.logout();
    req.session.save(() => {
        redirectForLocale(req, res, '/user/login?s=loggedOut');
    });
});

module.exports = router;
