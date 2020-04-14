'use strict';
const path = require('path');
const express = require('express');

const contentApi = require('../../common/content-api');
const { setCommonLocals } = require('../../common/inject-content');
const { basicContent } = require('../common');

const router = express.Router();

router.get('/', async function (req, res, next) {
    try {
        const entry = await contentApi.getFlexibleContent({
            locale: req.i18n.getLocale(),
            path: `${req.baseUrl}${req.path}`,
            requestParams: req.query,
        });

        if (entry) {
            setCommonLocals(req, res, entry);

            res.render(path.resolve(__dirname, './about.njk'), {
                flexibleContent: entry.flexibleContent,
            });
        } else {
            next();
        }
    } catch (error) {
        next(error);
    }
});

// @TODO: Can we move the our people section to About structure? Add "profile" type to flexible content
router.use('/our-people', require('./our-people'));
router.use('/*', basicContent());

module.exports = router;
