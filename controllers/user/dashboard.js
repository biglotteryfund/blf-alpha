'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.render(path.resolve(__dirname, './views/dashboard'), {
        user: req.user,
        errors: res.locals.errors || [],
        activationSent: req.query.s === 'activationSent'
    });
});

module.exports = router;
