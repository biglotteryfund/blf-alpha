'use strict';
const express = require('express');
const Sentry = require('@sentry/node');

const { csrfProtection } = require('../../common/cached');
const lookupPostcode = require('./lib/lookup-postcode');

const router = express.Router();

router.post('/', csrfProtection, async (req, res) => {
    function makeError(title, detail, source = null) {
        return res.status(400).json({
            errors: [{ status: 400, title, detail, source }]
        });
    }

    if (!req.body.q) {
        return makeError({
            title: 'Invalid query parameter',
            detail: 'Must include q parameter',
            source: { parameter: 'q' }
        });
    }
    try {
        const addresses = await lookupPostcode(req.body.q);
        return res.json({ addresses });
    } catch (error) {
        Sentry.captureException(error);
        return makeError({
            title: 'Connection error',
            detail: 'Failed to get data from API'
        });
    }
});

module.exports = router;
