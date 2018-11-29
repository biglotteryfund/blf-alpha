'use strict';
const path = require('path');
const express = require('express');

const contentApi = require('../../services/content-api');

const router = express.Router();

router.get('/', async (req, res, next) => {
    const locale = req.i18n.getLocale();

    try {
        const dataStats = await contentApi.getDataStats({
            locale: locale,
            previewMode: res.locals.PREVIEW_MODE || false
        });

        res.render(path.resolve(__dirname, './views/data'), { title: dataStats.title, dataStats });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
