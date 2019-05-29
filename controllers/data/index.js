'use strict';
const path = require('path');
const express = require('express');
const { get } = require('lodash');

const contentApi = require('../../common/content-api');

const router = express.Router();

router.get('/', async (req, res, next) => {
    const locale = req.i18n.getLocale();

    try {
        let query = {};
        if (req.query.social) {
            query.social = req.query.social;
        }
        const dataStats = await contentApi.getDataStats({
            locale: locale,
            previewMode: res.locals.PREVIEW_MODE || false,
            query: query
        });

        res.locals.openGraph = get(dataStats, 'openGraph', false);

        res.render(path.resolve(__dirname, './views/data'), { title: dataStats.title, dataStats });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
