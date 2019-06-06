'use strict';
const express = require('express');

const { localify } = require('../../common/urls');
const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');
const { requireNotStaffAuth } = require('../../middleware/authed');

const router = express.Router();

router.use(noCache, noindex);

router.use('/staff', require('./staff'));

router.use(requireNotStaffAuth, function(req, res, next) {
    res.locals.bodyClass = 'has-static-header'; // No hero images on user pages
    res.locals.sectionTitle = req.i18n.__('user.common.yourAccount');
    res.locals.sectionUrl = req.baseUrl;

    if (req.user) {
        res.locals.user = req.user;
    }

    next();
});

router.use('/', require('./dashboard'));
router.use('/login', require('./login'));
router.use('/register', require('./register'));
router.use('/activate', require('./activate'));
router.use('/password', require('./password'));

router.get('/logout', function(req, res) {
    req.logout();
    req.session.save(() => {
        const loginUrl = localify(req.i18n.getLocale())('/user/login');
        res.redirect(`${loginUrl}?s=loggedOut`);
    });
});

module.exports = router;
