'use strict';
const express = require('express');
const path = require('path');
const { pick, clone } = require('lodash');

const contentApi = require('../../common/content-api');

const {
    injectBreadcrumbs,
    injectCopy,
    injectHeroImage,
    injectResearch,
    injectResearchEntry
} = require('../../middleware/inject-content');
const { buildArchiveUrl } = require('../../common/archived');
const { localify } = require('../../common/urls');
const { buildPagination } = require('../../common/pagination');

const router = express.Router();

router.get('/', injectHeroImage('insights-letterbox-new'), injectCopy('insights'), injectResearch, (req, res) => {
    res.render(path.resolve(__dirname, './views/insights-landing'), {
        researchArchiveUrl: buildArchiveUrl(localify(req.i18n.getLocale())('/research'))
    });
});

router.get(
    '/documents',
    injectHeroImage('insights-letterbox-new'),
    injectCopy('insights.documents'),
    async (req, res, next) => {
        let query = pick(req.query, ['page', 'programme', 'tag', 'doctype', 'portfolio', 'q', 'sort']);
        res.locals.queryParams = clone(query);
        query['page-limit'] = 10;

        try {
            const research = await contentApi.getResearch({
                locale: req.i18n.getLocale(),
                previewMode: res.locals.PREVIEW_MODE || false,
                type: 'documents',
                query: query
            });

            res.locals.researchEntries = research.result;

            res.render(path.resolve(__dirname, './views/insights-documents'), {
                entriesMeta: research.meta,
                pagination: buildPagination(research.meta.pagination, req.query)
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get('/:slug', injectResearchEntry, injectBreadcrumbs, (req, res, next) => {
    const { researchEntry } = res.locals;
    if (researchEntry) {
        res.render(path.resolve(__dirname, './views/insights-detail'), {
            extraCopy: req.i18n.__('insights.detail'),
            entry: researchEntry
        });
    } else {
        next();
    }
});

module.exports = router;
