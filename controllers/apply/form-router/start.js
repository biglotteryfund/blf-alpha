'use strict';
const express = require('express');

function getNextPageUrl(baseUrl, hasEligibility = false) {
    const newUrl = `${baseUrl}/new`;
    const eligibilityUrl = `${baseUrl}/eligibility/1`;

    return hasEligibility ? eligibilityUrl : newUrl;
}

function router({ startTemplate, hasEligibility }) {
    const router = express.Router();

    router.get('/', function(req, res) {
        const nextPageUrl = getNextPageUrl(req.baseUrl, hasEligibility);
        if (startTemplate) {
            res.render(startTemplate, {
                backUrl: res.locals.sectionUrl,
                nextPageUrl: nextPageUrl
            });
        } else {
            res.redirect(nextPageUrl);
        }
    });

    return router;
}

module.exports = { getNextPageUrl, router };
