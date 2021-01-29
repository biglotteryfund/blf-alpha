'use strict';
const express = require('express');
const path = require('path');

const { flexibleContentPage } = require('../common');

const router = express.Router();

router.get('/', flexibleContentPage());

// Show the Siblings sidebar for Our People section
router.get('/our-people/*', (req, res, next) => {
    res.locals.showSiblings = true;
    next();
});

router.get('/customer-service/cookies', function (req, res) {
    res.render(path.resolve(__dirname, './views/cookie-policy'), {
        title: req.i18n.__('toplevel.cookies.title'),
    });
});

router.use('/newsletter', require('../newsletter'));

router.use('/*', flexibleContentPage());

module.exports = router;
