'use strict';
const express = require('express');

const { noindex } = require('../../middleware/robots');
const { toolsSecurityHeaders } = require('../../middleware/securityHeaders');

const router = express.Router();

router.use(noindex);

router.use('/', require('./dashboard'));
router.use('/login', require('./login'));
router.use('/logout', require('./logout'));
router.use('/activate', require('./activate'));


router.use(toolsSecurityHeaders());

router.use('/register', require('./register'));
router.use('/forgotten-password', require('./forgotten-password'));
router.use('/reset-password', require('./reset-password'));

module.exports = router;
