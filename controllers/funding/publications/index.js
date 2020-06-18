'use strict';
const path = require('path');
const express = require('express');

const {
    injectHeroImage,
    setCommonLocals,
} = require('../../../common/inject-content');
const { renderFlexibleContentChild } = require('../../common');
const contentApi = require('../../../common/content-api');

const router = express.Router();

function checkProgramme(req, res, next) {
    const programme = req.params.programme;
    const validProgrammes = ['a-better-start'];
    if (programme && validProgrammes.includes(programme)) {
        next();
    } else {
        res.redirect('/funding');
    }
}

router.get(
    '/:programme?',
    checkProgramme,
    injectHeroImage('a-better-start-new'),
    async function (req, res, next) {
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
                isBilingual: false, // Enable this if supporting additional programmes
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

router.get('/:programme/:slug', checkProgramme, async function (
    req,
    res,
    next
) {
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
                url: req.baseUrl,
            },
            {
                label: publication.meta.programme.title,
                url: `${req.baseUrl}/${publication.meta.programme.slug}`,
            }
        );
        renderFlexibleContentChild(req, res, publication.entry);
    } catch (error) {
        if (error.response.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
});

module.exports = router;
