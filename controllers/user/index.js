'use strict';
const express = require('express');
const router = express.Router();
const { concat } = require('lodash');

const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

router.use(noCache, noindex, (req, res, next) => {
    res.locals.isBilingual = false;
    next();
});

router.use((req, res, next) => {
    let crumbs = [
        {
            label: 'Your account',
            url: req.baseUrl
        }
    ];
    res.locals.breadcrumbs = crumbs;
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
