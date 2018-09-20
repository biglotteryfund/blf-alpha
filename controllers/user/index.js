'use strict';
const express = require('express');
const router = express.Router();

const { noCache } = require('../../middleware/cached');
const { noindex } = require('../../middleware/robots');

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

module.exports = router;
