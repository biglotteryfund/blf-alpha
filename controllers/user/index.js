'use strict';
const express = require('express');
const uuidv4 = require('uuid/v4');
const features = require('config').get('features');
const moment = require('moment');

const { Users } = require('../../db/models');
const { localify, redirectForLocale } = require('../../common/urls');
const { noStore } = require('../../common/cached');
const { requireNotStaffAuth } = require('../../common/authed');
const { injectCopy } = require('../../common/inject-content');
const logger = require('../../common/logger');

const router = express.Router();

router.use(noStore, function(req, res, next) {
    res.setHeader('X-Robots-Tag', 'noindex');
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
        }).then(newUser => {
            res.json({ username, password, id: newUser.id });
        });
    });
}

/**
 * Public user routes
 * Disallow staff from this point on
 */
router.use(requireNotStaffAuth, injectCopy('applyNext'), function(
    req,
    res,
    next
) {
    res.locals.bodyClass = 'has-static-header'; // No hero images on user pages
    res.locals.sectionTitle = req.i18n.__('user.common.yourAccount');
    res.locals.sectionUrl = req.baseUrl;

    if (req.user) {
        res.locals.user = req.user;

        const localeUrl = localify(req.i18n.getLocale());
        if (features.enableNewApplicationDashboards) {
            res.locals.userNavigationLinks = [
                {
                    url: localeUrl('/apply'),
                    label: req.i18n.__('applyNext.navigation.latestApplication')
                },
                {
                    url: localeUrl('/apply/all'),
                    label: req.i18n.__('applyNext.navigation.allApplications')
                },
                {
                    url: req.baseUrl,
                    label: req.i18n.__('applyNext.navigation.account')
                }
            ];
        } else {
            res.locals.userNavigationLinks = [
                {
                    url: localeUrl('/apply/awards-for-all'),
                    label: req.i18n.__('applyNext.navigation.applications')
                },
                {
                    url: localeUrl('/user'),
                    label: req.i18n.__('applyNext.navigation.account')
                },
                {
                    url: localeUrl('/user/logout'),
                    label: req.i18n.__('applyNext.navigation.logOut')
                }
            ];
        }
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
    logger.info('User logout', { service: 'user' });
    req.session.save(() => {
        redirectForLocale(req, res, '/user/login?s=loggedOut');
    });
});

router.get('/session', function(req, res) {
    res.send({
        expires: req.session.cookie.expires,
        maxAge: req.session.cookie.maxAge,
        originalMaxAge: req.session.cookie.originalMaxAge,
        isExpired: moment(req.session.cookie.expires).isBefore(moment()),
        isAuthenticated: req.isAuthenticated()
    });
});

module.exports = router;
