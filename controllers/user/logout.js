'use strict';
const express = require('express');

const router = express.Router();

const logger = require('../../common/logger');

router.get('/', async (req, res) => {
    logger.info('User logout');
    req.logout();
    req.session.save(() => {
        res.redirect('/user/login?s=loggedOut');
    });
});

module.exports = router;
