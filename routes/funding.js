'use strict';
const express = require('express');
const router = express.Router();
// const logger = require('../logger');

router.get('/funding-guidance/managing-your-funding', (req, res, next) => {
    res.render('pages/funding/guidance/managing-your-funding', {
        title: "Managing your funding"
    });
});

module.exports = router;
