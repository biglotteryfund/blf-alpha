'use strict';
const path = require('path');
const express = require('express');
const { get } = require('lodash');

const contentApi = require('../../common/content-api');
const { injectCopy, injectHeroImage } = require('../../common/inject-content');

const router = express.Router();

router.get(
    '/',
    injectHeroImage('fsn-new'),
    injectCopy('toplevel.data'),
    async (req, res, next) => {
        const locale = req.i18n.getLocale();

        try {
            const dataStats = await contentApi.getDataStats({
                locale: locale,
                requestParams: req.query
            });

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
