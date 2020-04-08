'use strict';
const path = require('path');
const express = require('express');

const {
    injectCopy,
    injectHeroImage,
    setCommonLocals,
} = require('../../common/inject-content');
const { renderFlexibleContentChild } = require('../common');
const contentApi = require('../../common/content-api');

const router = express.Router();

function isValidProgramme(programme) {
    const validProgrammes = ['a-better-start'];
    return programme && validProgrammes.includes(programme);
}

router.get(
    '/:programme?',
    /* @TODO: Rename this to not be scoped to insights namespace */
    injectCopy('insights.documents'),
    injectHeroImage('a-better-start-new'),
    async function (req, res, next) {
        if (isValidProgramme(req.params.programme) === false) {
            return next();
        }

        try {
            const [publicationTags, publications] = await Promise.all([
                contentApi.getPublicationTags({
                    locale: req.i18n.getLocale(),
                    programme: req.params.programme,
                }),
                contentApi.getPublications({
                    locale: req.i18n.getLocale(),
                    programme: req.params.programme,
                    searchParams: req.query,
                }),
            ]);

            if (req.params.programme === 'a-better-start') {
                res.locals.title = 'Publications: A Better Start';
                res.locals.intro = `We want learning from A Better Start to influence parents, practitioners and policy makers. Read updates from across the A Better Start programme sharing our experiences as we develop innovative ways to give pregnant women and babies the best possible start.`;
            }

            res.render(path.resolve(__dirname, './views/publication-search'), {
                // Enable welsh language if using for publications outside of England
                isBilingual: false,
                publicationEntries: publications.result,
                publicationTags: publicationTags,
                queryParams: req.query,
                baseUrl: req.baseUrl + req.path,
                entriesMeta: publications.meta,
                pagination: publications.pagination,
                programme: req.params.programme,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get('/:programme/:slug', async function (req, res, next) {
    if (isValidProgramme(req.params.programme) === false) {
        return next();
    }

    try {
        const publication = await contentApi.getPublications({
            locale: req.i18n.getLocale(),
            programme: req.params.programme,
            slug: req.params.slug,
            searchParams: req.query,
        });
        setCommonLocals(req, res, publication.entry);
        res.locals.breadcrumbs = res.locals.breadcrumbs.concat(
            {
                label: 'Publications',
                url: req.baseUrl + '/publications',
            },
            {
                label: publication.meta.programme.title,
                url:
                    req.baseUrl +
                    '/publications/' +
                    publication.meta.programme.slug,
            }
        );
        renderFlexibleContentChild(req, res, publication.entry);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
