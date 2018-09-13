'use strict';
const path = require('path');
const express = require('express');
const { sortBy } = require('lodash');

const contentApi = require('../../services/content-api');
const { injectCopy, injectHeroImage } = require('../../middleware/inject-content');

const router = express.Router();

router.get('/', injectHeroImage('young-shoulders-programme'), injectCopy('toplevel.data'), async (req, res, next) => {
    const locale = req.i18n.getLocale();

    try {
        const [statRegions, statPage] = await Promise.all([
            contentApi.getStatRegions(locale),
            contentApi.getDataStats({
                locale: locale,
                previewMode: res.locals.PREVIEW_MODE || false
            })
        ]);

        res.render(path.resolve(__dirname, './views/data'), {
            statRegions: sortBy(statRegions, 'title'),
            statPage: statPage
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
