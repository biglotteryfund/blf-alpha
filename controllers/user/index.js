'use strict';
const express = require('express');

const { noindex } = require('../../middleware/robots');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');

const router = express.Router();

router.use(noindex, toolsSecurityHeaders());

router.use('/', require('./dashboard'));
router.use('/login', require('./login'));
router.use('/register', require('./register'));
router.use('/activate', require('./activate'));
router.use('/forgotten-password', require('./forgotten-password'));
router.use('/reset-password', require('./reset-password'));
router.use('/logout', require('./logout'));

module.exports = router;
