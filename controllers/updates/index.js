'use strict';
const express = require('express');
const { isArray } = require('lodash');
const { getUpdates } = require('../../services/content-api');
const appData = require('../../modules/appData');

const router = express.Router();

if (appData.isNotProduction) {
    router.get('/:type?/:date?/:slug?', async (req, res, next) => {
        let urlPath = '';
        let query = {};

        const isSinglePost = req.params.date && req.params.slug;

        if (req.params.type) {
            urlPath += `/${req.params.type.replace('-', '_')}`;
        }

        if (isSinglePost) {
            urlPath += `/${req.params.date}/${req.params.slug}`;
        } else {
            query.page = req.query.page;
            query.tag = req.query.tag;
            query.author = req.query.author;
            query.category = req.query.category;
        }

        try {
            const response = await getUpdates({
                locale: req.i18n.getLocale(),
                urlPath: urlPath,
                query: query
            });

            if (response.result) {
                if (isArray(response.result)) {
                    res.send({
                        type: 'listing',
                        data: response
                    });
                } else {
                    if (req.baseUrl + req.path !== response.result.linkUrl) {
                        res.redirect(response.result.linkUrl);
                    } else {
                        res.send({
                            type: 'single',
                            data: response
                        });
                    }
                }
            } else {
                next();
            }
        } catch (e) {
            res.send(e);
        }
    });
}

module.exports = router;
