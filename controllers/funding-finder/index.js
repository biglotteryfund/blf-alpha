'use strict';
const express = require('express');
const { localify, normaliseQuery } = require('../../modules/urls');
const { reformatQueryString } = require('./helpers');

const router = express.Router();

/**
 * Legacy funding finder
 * Normalise the query string and redirect to the appropriate funding programmes list.
 * @TODO: Can we drop this and replace with wild-card redirects?
 */
router.route('').get((req, res) => {
    req.query = normaliseQuery(req.query);
    const showClosed = parseInt(req.query.sc, 10) === 1;
    const urlForLocale = localify(req.i18n.getLocale());

    if (showClosed) {
        res.redirect(301, urlForLocale('/funding/programmes/all'));
    } else {
        // Redirect from funding finder to new programmes page
        const newQuery = reformatQueryString({
            originalAreaQuery: req.query.area,
            originalAmountQuery: req.query.amount
        });

        const redirectUrl = urlForLocale('/funding/programmes') + (newQuery.length > 0 ? `?${newQuery}` : '');
        res.redirect(301, redirectUrl);
    }
});

module.exports = router;
