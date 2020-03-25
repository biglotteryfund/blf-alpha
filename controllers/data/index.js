'use strict';
const path = require('path');
const express = require('express');
const get = require('lodash/get');

const contentApi = require('../../common/content-api');
const { injectHeroImage } = require('../../common/inject-content');

const router = express.Router();

router.get('/', injectHeroImage('fsn-new'), async function (req, res, next) {
    try {
        const dataStats = await contentApi.getDataStats(
            req.i18n.getLocale(),
            req.query
        );

        res.render(path.resolve(__dirname, './views/data'), {
            title: dataStats.title,
            openGraph: get(dataStats, 'openGraph', false),
            dataStats: dataStats,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
