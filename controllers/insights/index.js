'use strict';
const express = require('express');
const path = require('path');
const clone = require('lodash/clone');
const compact = require('lodash/compact');
const pick = require('lodash/pick');

const contentApi = require('../../common/content-api');
const {
    injectCopy,
    injectHeroImage,
    setCommonLocals,
} = require('../../common/inject-content');
const { buildArchiveUrl, localify } = require('../../common/urls');

const router = express.Router();

router.use(injectHeroImage('insights-letterbox-new'));

router.get('/', injectCopy('insights'), async (req, res, next) => {
    try {
        const research = await contentApi.getResearch({
            locale: req.i18n.getLocale(),
            requestParams: req.query,
        });

        res.render(path.resolve(__dirname, './views/insights-landing'), {
            researchEntries: research.result,
            researchArchiveUrl: buildArchiveUrl(
                localify(req.i18n.getLocale())('/research')
            ),
        });
    } catch (error) {
        next(error);
    }
});

router.get(
    '/documents/:slug?',
    injectCopy('insights.documents'),
    async function (req, res, next) {
        let query = pick(req.query, [
            'page',
            'programme',
            'tag',
            'doctype',
            'portfolio',
            'q',
            'sort',
        ]);
        res.locals.queryParams = clone(query);
        query['page-limit'] = 10;

        if (req.params.slug) {
            res.locals.documentSlug = req.params.slug;
            query['slug'] = req.params.slug;
        }

        try {
            const research = await contentApi.getResearch({
                locale: req.i18n.getLocale(),
                type: 'documents',
                query: query,
                requestParams: req.query,
            });

            res.locals.researchEntries = research.result;

            res.render(path.resolve(__dirname, './views/insights-documents'), {
                entriesMeta: research.meta,
                pagination: research.pagination,
            });
        } catch (error) {
            if (error.response.statusCode >= 500) {
                next(error);
            } else {
                next();
            }
        }
    }
);

router.get('/:slug/:child_slug?', async function (req, res, next) {
    try {
        const entry = await contentApi.getResearch({
            slug: compact([req.params.slug, req.params.child_slug]).join('/'),
            locale: req.i18n.getLocale(),
            requestParams: req.query,
        });

        const breadcrumbs = entry.parent
            ? res.locals.breadcrumbs.concat([
                  {
                      label: entry.parent.title,
                      url: entry.parent.linkUrl,
                  },
                  { label: entry.title },
              ])
            : res.locals.breadcrumbs.concat({ label: entry.title });

        setCommonLocals(req, res, entry);

        if (entry) {
            res.render(path.resolve(__dirname, './views/insights-detail'), {
                extraCopy: req.i18n.__('insights.detail'),
                entry: entry,
                breadcrumbs: breadcrumbs,
            });
        } else {
            next();
        }
    } catch (error) {
        console.log(error.response.statusCode);
        if (error.response.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
});

module.exports = router;
