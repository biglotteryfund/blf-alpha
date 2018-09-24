'use strict';
const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
    req.logout();
    req.session.save(() => {
        res.redirect('/user/login');
    });
});

module.exports = router;
