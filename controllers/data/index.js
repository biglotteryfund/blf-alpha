'use strict';
const path = require('path');
const express = require('express');
const get = require('lodash/get');

const contentApi = require('../../common/content-api');
const { injectCopy, injectHeroImage } = require('../../common/inject-content');

const router = express.Router();

router.get(
    '/',
    injectHeroImage('fsn-new'),
    injectCopy('toplevel.data'),
    async (req, res, next) => {
        try {
            const dataStats = await contentApi.getDataStats(
                req.i18n.getLocale(),
                req.query
            );

            res.locals.openGraph = get(dataStats, 'openGraph', false);

            res.render(path.resolve(__dirname, './views/data'), {
                title: dataStats.title,
                dataStats
            });
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
