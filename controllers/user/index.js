'use strict';
const express = require('express');
const { get } = require('lodash');

const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

const router = express.Router();

router.use(noCache, noindex, (req, res, next) => {
    res.locals.isBilingual = false;
    next();
});

router.use('/', require('./dashboard'));
router.use('/login', require('./login'));
router.use('/logout', require('./logout'));
router.use('/register', require('./register'));
router.use('/activate', require('./activate'));
router.use('/forgotten-password', require('./forgotten-password'));
router.use('/reset-password', require('./reset-password'));
router.use('/staff', require('./staff'));


function ensureUserOnly(req, res, next) {
    if (req.isAuthenticated() && get(req, ['user', 'userType'], false) === 'user') {
        return next();
    }
    res.redirect('/user/login');
}

function ensureStaffOnly(req, res, next) {
    if (req.isAuthenticated() && get(req, ['user', 'userType'], false) === 'staff') {
        return next();
    }
    req.session.redirectUrl = req.originalUrl;
    req.session.save(() => {
        res.redirect('/user/staff/login');
    });
}

router.get('/user-only', ensureUserOnly, (req, res) => {
    res.send(req.user);
});

router.get('/staff-only', ensureStaffOnly, (req, res) => {
    res.send(req.user);
});



module.exports = router;
