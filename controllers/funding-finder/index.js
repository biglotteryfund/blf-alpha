'use strict';
const express = require('express');
const Raven = require('raven');
const { localify, normaliseQuery } = require('../../modules/urls');
const { reformatQueryString } = require('./helpers');
const { proxyLegacyPage, postToLegacyForm } = require('../../modules/legacy');
const { stripCSPHeader } = require('../../middleware/securityHeaders');

const router = express.Router();

/**
 * Route: Legacy funding finder
 * Proxy the legacy funding finder for closed programmes (where `sc` query is present)
 * For all other requests normalise the query string and redirect to the new funding programmes list.
 */
router
    .route('')
    .get(stripCSPHeader, (req, res) => {
        req.query = normaliseQuery(req.query);
        const showClosed = parseInt(req.query.sc, 10) === 1;
        const programmesUrl = localify(req.i18n.getLocale())('/funding/programmes');

        if (showClosed) {
            // Proxy legacy funding finder for closed programmes
            proxyLegacyPage({ req, res }).catch(error => {
                Raven.captureException(error);
                res.redirect(programmesUrl);
            });
        } else {
            // Redirect from funding finder to new programmes page
            const newQuery = reformatQueryString({
                originalAreaQuery: req.query.area,
                originalAmountQuery: req.query.amount
            });

            const redirectUrl = programmesUrl + (newQuery.length > 0 ? `?${newQuery}` : '');

            res.redirect(301, redirectUrl);
        }
    })
    .post(postToLegacyForm);

module.exports = router;
