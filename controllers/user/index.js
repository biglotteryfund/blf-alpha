'use strict';
const express = require('express');
const router = express.Router();

const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

router.use(noCache, noindex, (req, res, next) => {
    res.locals.bodyClass = 'has-static-header'; // No hero images on user pages
    res.locals.breadcrumbs = [
        {
            label: req.i18n.__('user.common.yourAccount'),
            url: req.baseUrl
        }
    ];

    if (req.user) {
        res.locals.user = req.user;
    }

    next();
});

router.use('/', require('./dashboard'));
router.use('/login', require('./login'));
router.use('/logout', require('./logout'));
router.use('/register', require('./register'));
router.use('/activate', require('./activate'));
router.use('/password', require('./password'));
router.use('/staff', require('./staff'));

module.exports = router;
