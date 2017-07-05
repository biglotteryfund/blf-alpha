'use strict';
const express = require('express');
const config = require('config');
const router = express.Router();
const routeStatic = require('../utils/routeStatic');

module.exports = (pages) => {

    /**
     * 1. Populate static pages
     */
    for (let page in pages) {
        if (pages[page].static) { routeStatic(pages[page], router); }
    }

    // handle contrast shifter
    router.get('/contrast/:mode', (req, res, next) => {
        res.cacheControl = { maxAge: 1 };
        let duration = 6 * 30 * 24 * 60 * 60; // 6 months
        let cookieName = config.get('contrastCookie.name');
        let redirectUrl = req.query.url || '/';
        if (req.params.mode === 'high') {
            res.cookie(cookieName, req.params.mode, {
                maxAge: duration,
                httpOnly: false
            });
        } else {
            res.clearCookie(cookieName);
        }
        res.redirect(redirectUrl);
    });

    return router;
};