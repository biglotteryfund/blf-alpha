'use strict';
const express = require('express');

const { noindex } = require('../../middleware/robots');

const router = express.Router();

router.use(noindex, (req, res, next) => {
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

module.exports = router;
