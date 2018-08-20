'use strict';
const path = require('path');
const express = require('express');
const router = express.Router();
const routeHelpers = require('../helpers/route-helpers');

router.get('/', async (req, res, next) => {
    try {
        const canonicalRoutes = await routeHelpers.getCanonicalRoutes();
        res.render(path.resolve(__dirname, './views/pagelist'), {
            canonicalRoutes
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
