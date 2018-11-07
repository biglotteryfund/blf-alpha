'use strict';
const path = require('path');
const express = require('express');
const { concat } = require('lodash');
const config = require('config');

const { injectBreadcrumbs, injectHeroImage, injectCopy } = require('../../middleware/inject-content');
const { sMaxAge } = require('../../middleware/cached');

const router = express.Router();

router.use(sMaxAge('1d'), injectBreadcrumbs, (req, res, next) => {
    res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
        label: req.i18n.__('funding.pastGrants.title'),
        url: req.baseUrl
    });
    next();
});

const grantNavLink =
    'http://grantnav.threesixtygiving.org/search?json_query=%7B%22query%22%3A+%7B%22bool%22%3A+%7B%22filter%22%3A+%5B%7B%22bool%22%3A+%7B%22should%22%3A+%5B%7B%22term%22%3A+%7B%22fundingOrganization.id_and_name%22%3A+%22%5B%5C%22The+Big+Lottery+Fund%5C%22%2C+%5C%22360G-blf%5C%22%5D%22%7D%7D%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%2C+%22must%22%3A+%7B%7D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%7B%22range%22%3A+%7B%22amountAwarded%22%3A+%7B%7D%7D%7D%2C+%22must%22%3A+%7B%7D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%2C+%7B%22bool%22%3A+%7B%22should%22%3A+%5B%5D%7D%7D%5D%2C+%22must%22%3A+%7B%22query_string%22%3A+%7B%22default_field%22%3A+%22_all%22%2C+%22query%22%3A+%22%2A%22%7D%7D%7D%7D%2C+%22sort%22%3A+%7B%22_score%22%3A+%7B%22order%22%3A+%22desc%22%7D%7D%2C+%22aggs%22%3A+%7B%22recipientDistrictName%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22recipientDistrictName%22%7D%7D%2C+%22currency%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22currency%22%7D%7D%2C+%22recipientOrganization%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22recipientOrganization.id_and_name%22%7D%7D%2C+%22fundingOrganization%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22fundingOrganization.id_and_name%22%7D%7D%2C+%22recipientRegionName%22%3A+%7B%22terms%22%3A+%7B%22size%22%3A+3%2C+%22field%22%3A+%22recipientRegionName%22%7D%7D%7D%2C+%22extra_context%22%3A+%7B%22awardYear_facet_size%22%3A+3%2C+%22amountAwardedFixed_facet_size%22%3A+3%7D%7D';

// @TODO Post-launch, we can delete the second branch here and rename the search controller.
if (config.get('features.enableNewPastGrantsSearch')) {
    router.use('/', require('./search'));
} else {
    router.get('/', injectCopy('funding.pastGrants'), injectHeroImage('tinylife'), async (req, res) => {
        res.render(path.resolve(__dirname, './views/index'), { grantNavLink });
    });
}

module.exports = router;
