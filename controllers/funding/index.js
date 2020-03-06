'use strict';
const path = require('path');
const express = require('express');
const clone = require('lodash/clone');
const pick = require('lodash/pick');

const {
    injectCopy,
    injectHeroImage,
    setCommonLocals
} = require('../../common/inject-content');
const { renderFlexibleContentChild } = require('../common');
const { sMaxAge } = require('../../common/cached');
const contentApi = require('../../common/content-api');

const router = express.Router();

router.get(
    '/',
    sMaxAge(1800),
    injectCopy('toplevel.funding'),
    injectHeroImage('funding-letterbox-new'),
    async (req, res) => {
        let latestProgrammes = [];
        try {
            const fundingProgrammes = await contentApi.getRecentFundingProgrammes(
                { locale: req.i18n.getLocale(), limit: 3 }
            );

            latestProgrammes = fundingProgrammes.result
                ? fundingProgrammes.result
                : [];
        } catch (error) {} // eslint-disable-line no-empty

        res.render(path.resolve(__dirname, './views/funding-landing'), {
            latestProgrammes
        });
    }
);

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
    async (req, res, next) => {
        let query = pick(req.query, ['page', 'tag', 'q', 'sort']);
        res.locals.queryParams = clone(query);
        query['page-limit'] = 10;
        const programme = req.params.programme;

        try {
            const publicationTags = await contentApi.getPublicationTags({
                locale: req.i18n.getLocale(),
                programme: programme
            });
            const publications = await contentApi.getPublications({
                locale: req.i18n.getLocale(),
                programme: programme,
                query: query,
                requestParams: req.query
            });

            res.locals.isBilingual = false;
            res.locals.publicationEntries = publications.result;
            res.locals.publicationTags = publicationTags;

            res.render(path.resolve(__dirname, './views/publication-search'), {
                baseUrl: req.baseUrl + req.path,
                entriesMeta: publications.meta,
                pagination: publications.pagination,
                programme: programme
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
