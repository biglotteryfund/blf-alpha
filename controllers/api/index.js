'use strict';
const express = require('express');
const Sentry = require('@sentry/node');

const appData = require('../../common/appData');
const { POSTCODES_API_KEY } = require('../../common/secrets');
const { csrfProtection } = require('../../common/cached');

const { Client } = require('@ideal-postcodes/core-node');
const postcodesClient = new Client({
    api_key: POSTCODES_API_KEY
});

const router = express.Router();

/**
 * API: UK address lookup proxy
 */
router.post('/address-lookup', csrfProtection, async (req, res) => {
    const makeError = (title, detail, source = null) => {
        return res.status(400).json({
            errors: [
                {
                    status: 400,
                    title,
                    detail,
                    source
                }
            ]
        });
    };

    const query = req.body.q;

    if (!query) {
        return makeError({
            title: 'Invalid query parameter',
            detail: 'Must include q parameter',
            source: { parameter: 'q' }
        });
    }
    try {
        // Tag the postcode lookup with metadata
        const tags = [
            `ENV_${appData.environment}`,
            `BUILD_${appData.buildNumber}`
        ];
        const addresses = await postcodesClient.lookupPostcode({
            postcode: query,
            tags: tags
        });
        return res.json({ addresses });
    } catch (error) {
        Sentry.captureException(error);
        return makeError({
            title: 'Connection error',
            detail: 'Failed to get data from API'
        });
    }
});

/**
 * API: Feedback endpoint
 */
router.use('/feedback', require('./feedback'));

/**
 * API: Survey endpoint
 */
router.use('/survey', require('./survey'));

module.exports = router;
