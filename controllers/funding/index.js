'use strict';
const path = require('path');
const express = require('express');

const {
    injectCopy,
    injectHeroImage,
    setCommonLocals
} = require('../../common/inject-content');
const { renderFlexibleContentChild } = require('../common');
const contentApi = require('../../common/content-api');

const router = express.Router();

router.get('/', injectHeroImage('funding-letterbox-new'), async (req, res) => {
    /**
     * Fetch latest funding programmes, but consider them optional,
     * we can still render the page without them.
     */
    let latestProgrammes = [];
    try {
        latestProgrammes = await contentApi.getRecentFundingProgrammes(
            req.i18n.getLocale()
        );
    } catch (error) {} // eslint-disable-line no-empty

    res.render(path.resolve(__dirname, './views/funding-landing'), {
        title: req.i18n.__('toplevel.funding.title'),
        latestProgrammes: latestProgrammes,
    });
});

const checkValidPublicationProgramme = (req, res, next) => {
    const programme = req.params.programme;
    const validProgrammes = ['a-better-start'];
    if (!programme || !validProgrammes.includes(programme)) {
        return res.redirect('/funding');
    }
    return next();
};

router.get(
    '/publications/:programme?',
    checkValidPublicationProgramme,
    injectCopy('insights.documents'),
    injectHeroImage('a-better-start-new'),
    async function(req, res, next) {
        try {
            const [publicationTags, publications] = await Promise.all([
                contentApi.getPublicationTags({
                    locale: req.i18n.getLocale(),
                    programme: req.params.programme
                }),
                contentApi.getPublications({
                    locale: req.i18n.getLocale(),
                    programme: req.params.programme,
                    requestParams: req.query
                })
            ]);

            if (req.params.programme === 'a-better-start') {
                res.locals.title = 'Publications: A Better Start';
                res.locals.intro = `We want learning from A Better Start to influence parents, practitioners and policy makers. Read updates from across the A Better Start programme sharing our experiences as we develop innovative ways to give pregnant women and babies the best possible start.`;
            }

            res.render(path.resolve(__dirname, './views/publication-search'), {
                isBilingual: false, // @TODO: Should we enable Welsh language here?
                publicationEntries: publications.result,
                publicationTags: publicationTags,
                queryParams: req.query,
                baseUrl: req.baseUrl + req.path,
                entriesMeta: publications.meta,
                pagination: publications.pagination,
                programme: req.params.programme
            });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/publications/:programme/:slug',
    checkValidPublicationProgramme,
    async (req, res, next) => {
        try {
            const publication = await contentApi.getPublications({
                locale: req.i18n.getLocale(),
                programme: req.params.programme,
                slug: req.params.slug,
                requestParams: req.query
            });
            setCommonLocals(req, res, publication.entry);
            res.locals.breadcrumbs = res.locals.breadcrumbs.concat(
                {
                    label: 'Publications',
                    url: req.baseUrl + '/publications'
                },
                {
                    label: publication.meta.programme.title,
                    url:
                        req.baseUrl +
                        '/publications/' +
                        publication.meta.programme.slug
                }
            );
            renderFlexibleContentChild(req, res, publication.entry);
        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
