'use strict';
const { flatten, get, getOr, last } = require('lodash/fp');
const moment = require('moment');
const Raven = require('raven');

const { heroImages } = require('../modules/images');
const { localify, removeWelsh } = require('../modules/urls');
const contentApi = require('../services/content-api');

function getPreviewStatus(entry) {
    return {
        isDraftOrVersion: entry.status === 'draft' || entry.status === 'version',
        lastUpdated: moment(entry.dateUpdated.date).format('Do MMM YYYY [at] h:mma')
    };
}

function injectHeroImage(page) {
    const heroSlug = get('heroSlug')(page);
    return async function(req, res, next) {
        if (!heroSlug) {
            return next();
        }

        // Set defaults
        res.locals.heroImage = heroImages.fallbackHeroImage;
        res.locals.socialImage = heroImages.fallbackHeroImage;

        res.locals.timings.start('inject-hero');

        try {
            const heroImage = await contentApi.getHeroImage({
                locale: req.i18n.getLocale(),
                slug: heroSlug
            });

            res.locals.timings.end('inject-hero');
            res.locals.heroImage = heroImage;
            res.locals.socialImage = heroImage;
            next();
        } catch (error) {
            Raven.captureException(error);
            next();
        }
    };
}

function injectCopy(page) {
    return function(req, res, next) {
        if (page.lang) {
            const copy = req.i18n.__(page.lang);
            res.locals.copy = copy;
            res.locals.title = copy.title;
            res.locals.description = copy.description || false;
        }

        next();
    };
}

function injectBreadcrumbs(req, res, next) {
    const locale = req.i18n.getLocale();
    const copy = res.locals.copy;
    const content = res.locals.content;

    const cleanedSection = removeWelsh(req.baseUrl).replace(/^\/+/g, '');
    const sectionSlug = cleanedSection === '' ? 'home' : cleanedSection;
    const sectionLabel = req.i18n.__(`global.nav.${sectionSlug}`);
    const sectionUrl = req.baseUrl === '' ? '/' : req.baseUrl;

    if (sectionLabel) {
        const topLevelCrumb = {
            label: sectionLabel,
            url: localify(locale)(sectionUrl)
        };

        const ancestors = getOr([], 'ancestors')(content);
        const ancestorCrumbs = ancestors.map(ancestor => ({
            label: ancestor.title,
            url: localify(locale)(`/${ancestor.path}`)
        }));

        const getTitle = get('title');
        const currentCrumb = {
            label: getTitle(content) || getTitle(copy)
        };

        res.locals.breadcrumbs = flatten([topLevelCrumb, ancestorCrumbs, currentCrumb]);
    }

    next();
}

async function injectListingContent(req, res, next) {
    try {
        res.locals.timings.start('inject-content');

        const content = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            previewMode: res.locals.PREVIEW_MODE || false
        });

        if (content) {
            res.locals.content = content;
            res.locals.previewStatus = getPreviewStatus(content);
        }

        res.locals.timings.end('inject-content');
        next();
    } catch (error) {
        next(error);
    }
}

async function injectFlexibleContent(req, res, next) {
    try {
        const entry = await contentApi.getFlexibleContent({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            previewMode: res.locals.PREVIEW_MODE || false
        });

        res.locals.entry = entry;
        res.locals.previewStatus = getPreviewStatus(entry);
        next();
    } catch (error) {
        next(error);
    }
}

async function injectFundingProgramme(req, res, next) {
    try {
        res.locals.timings.start('fetch-funding-programme');

        const entry = await contentApi.getFundingProgramme({
            slug: last(req.path.split('/')), // @TODO: Is there a cleaner way to define this?
            locale: req.i18n.getLocale(),
            previewMode: res.locals.PREVIEW_MODE || false
        });

        res.locals.fundingProgramme = entry;
        res.locals.previewStatus = getPreviewStatus(entry);
        res.locals.timings.end('fetch-funding-programme');
        next();
    } catch (error) {
        next();
    }
}

async function injectFundingProgrammes(req, res, next) {
    try {
        res.locals.timings.start('inject-funding-programmes');
        const fundingProgrammes = await contentApi.getFundingProgrammes({
            locale: req.i18n.getLocale()
        });
        res.locals.fundingProgrammes = fundingProgrammes;
        res.locals.timings.end('inject-funding-programmes');
        next();
    } catch (error) {
        next();
    }
}

async function injectBlogPosts(req, res, next) {
    try {
        const result = await contentApi.getBlogPosts({
            locale: req.i18n.getLocale(),
            page: req.query.page || 1
        });

        res.locals.blogPosts = result;
        next();
    } catch (error) {
        next();
    }
}

async function injectBlogDetail(req, res, next) {
    try {
        const [response, result] = await contentApi.getBlogDetail({
            locale: req.i18n.getLocale(),
            urlPath: req.path
        });

        if (result) {
            res.locals.blogDetail = {
                meta: get('meta')(response),
                result: result
            };
        }

        next();
    } catch (error) {
        next();
    }
}

function injectProfiles(section) {
    return async function(req, res, next) {
        try {
            const profiles = await contentApi.getProfiles({
                locale: req.i18n.getLocale(),
                section: section
            });

            res.locals.profiles = profiles;
            next();
        } catch (error) {
            Raven.captureException(error);
            next();
        }
    };
}

module.exports = {
    getPreviewStatus,
    injectBlogDetail,
    injectBlogPosts,
    injectBreadcrumbs,
    injectCopy,
    injectFlexibleContent,
    injectFundingProgramme,
    injectFundingProgrammes,
    injectHeroImage,
    injectListingContent,
    injectProfiles
};
