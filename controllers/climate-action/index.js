'use strict';
const express = require('express');
const path = require('path');
const compact = require('lodash/compact');

const { ContentApiClient } = require('../../common/content-api');
const {
    injectHeroImage,
    setCommonLocals
} = require('../../common/inject-content');
const {
    flexibleContentPage,
    renderFlexibleContentChild
} = require('../common');

const router = express.Router();
const ContentApi = new ContentApiClient();

router.use(injectHeroImage('insights-letterbox-new'));

router.use('/climate-action-fund/*', flexibleContentPage());

router.get('/:slug/:child_slug?', async function(req, res, next) {
    try {
        const entry = await ContentApi.init({
            flags: res.locals.cmsFlags
        }).getResearch({
            slug: compact([req.params.slug, req.params.child_slug]).join('/'),
            locale: req.i18n.getLocale(),
            requestParams: req.query
        });

        setCommonLocals(req, res, entry);

        if (entry && entry.entryType === 'contentPage') {
            renderFlexibleContentChild(req, res, entry);
        } else if (entry) {
            if (entry.parent) {
                res.locals.breadcrumbs.push({
                    label: entry.parent.title,
                    url: entry.parent.linkUrl
                });
            }

            res.render(path.resolve(__dirname, './views/climate-default'), {
                entry: entry,
                breadcrumbs: res.locals.breadcrumbs.concat({
                    label: entry.title
                })
            });
        } else {
            next();
        }
    } catch (error) {
        if (error.response.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
});

module.exports = router;
