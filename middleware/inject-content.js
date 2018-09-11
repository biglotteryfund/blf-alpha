'use strict';
const { flatten, get, getOr, last } = require('lodash/fp');
const moment = require('moment');
const Raven = require('raven');

const { localify, removeWelsh } = require('../modules/urls');
const { isBilingual } = require('../modules/pageLogic');
const contentApi = require('../services/content-api');

function getPreviewStatus(entry) {
    return {
        isDraftOrVersion: entry.status === 'draft' || entry.status === 'version',
        lastUpdated: moment(entry.dateUpdated.date).format('Do MMM YYYY [at] h:mma')
    };
}

/**
 * Sets locals that are common to many enries.
 * - heroImage (with fallback)
 * - title based on content
 * - isBilingual based on availableLanguages property
 */
function setCommonLocals(res, entry) {
    res.locals.title = entry.displayTitle || entry.title;
    res.locals.heroImage = entry.hero;
    res.locals.isBilingual = isBilingual(entry.availableLanguages);
    res.locals.previewStatus = getPreviewStatus(entry);
}

function injectHeroImage(heroSlug) {
    return async function(req, res, next) {
        if (heroSlug) {
            const { fallbackHeroImage } = res.locals;

            // Set defaults
            res.locals.heroImage = fallbackHeroImage;
            res.locals.socialImage = fallbackHeroImage;

            try {
                const heroImage = await contentApi.getHeroImage({
                    locale: req.i18n.getLocale(),
                    slug: heroSlug
                });

                res.locals.heroImage = heroImage;
                res.locals.socialImage = heroImage;
                next();
            } catch (error) {
                Raven.captureException(error);
                next();
            }
        } else {
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

    if (res.locals.sectionTitle && res.locals.sectionUrl) {
        const topLevelCrumb = {
            label: res.locals.sectionTitle,
            url: res.locals.sectionUrl
        };

        const ancestors = getOr([], 'ancestors')(res.locals.content);
        const ancestorCrumbs = ancestors.map(ancestor => {
            return {
                label: ancestor.title,
                url: localify(locale)(`/${ancestor.path}`)
            };
        });

        const breadcrumbs = flatten([topLevelCrumb, ancestorCrumbs]);

        const getTitle = get('title');
        const injectedTitle = res.locals.title || getTitle(res.locals.content);

        if (injectedTitle) {
            breadcrumbs.push({
                label: injectedTitle
            });
        }

        res.locals.breadcrumbs = breadcrumbs;
    }

    next();
}

async function injectListingContent(req, res, next) {
    try {
        const content = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            previewMode: res.locals.PREVIEW_MODE || false
        });

        if (content) {
            res.locals.content = content;
            setCommonLocals(res, content);
        }

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
        const entry = await contentApi.getFundingProgramme({
            slug: last(req.path.split('/')), // @TODO: Is there a cleaner way to define this?
            locale: req.i18n.getLocale(),
            previewMode: res.locals.PREVIEW_MODE || false
        });

        res.locals.fundingProgramme = entry;
        res.locals.previewStatus = getPreviewStatus(entry);
        next();
    } catch (error) {
        next();
    }
}

async function injectFundingProgrammes(req, res, next) {
    try {
        res.locals.fundingProgrammes = await contentApi.getFundingProgrammes({
            locale: req.i18n.getLocale()
        });
        next();
    } catch (error) {
        next();
    }
}

async function injectStrategicProgramme(req, res, next) {
    try {
        // Assumes a parameter of :slug in the request
        const { slug } = req.params;
        if (slug) {
            const strategicProgramme = await contentApi.getStrategicProgrammes({
                locale: req.i18n.getLocale(),
                slug: slug
            });

            res.locals.strategicProgramme = strategicProgramme;
            setCommonLocals(res, strategicProgramme);
        }
        next();
    } catch (error) {
        next();
    }
}

async function injectStrategicProgrammes(req, res, next) {
    try {
        res.locals.strategicProgrammes = await contentApi.getStrategicProgrammes({
            locale: req.i18n.getLocale()
        });
        next();
    } catch (error) {
        next();
    }
}

async function injectResearch(req, res, next) {
    try {
        res.locals.researchEntries = await contentApi.getResearch({
            locale: req.i18n.getLocale(),
            searchQuery: req.query.q
        });
        next();
    } catch (error) {
        next();
    }
}

async function injectResearchEntry(req, res, next) {
    try {
        // Assumes a parameter of :slug in the request
        const { slug } = req.params;
        if (slug) {
            const entry = await contentApi.getResearch({
                slug: slug,
                locale: req.i18n.getLocale(),
                previewMode: res.locals.PREVIEW_MODE || false
            });

            res.locals.researchEntry = entry;
            setCommonLocals(res, entry);
        }
        next();
    } catch (error) {
        next();
    }
}

async function injectBlogPosts(req, res, next) {
    try {
        res.locals.blogPosts = await contentApi.getBlogPosts({
            locale: req.i18n.getLocale(),
            page: req.query.page || 1
        });
        next();
    } catch (error) {
        next();
    }
}

async function injectBlogDetail(req, res, next) {
    try {
        const blogDetail = await contentApi.getBlogDetail({
            urlPath: req.path,
            locale: req.i18n.getLocale(),
            previewMode: res.locals.PREVIEW_MODE || false
        });

        if (blogDetail) {
            res.locals.blogDetail = blogDetail;

            if (blogDetail.meta.pageType === 'blogpost') {
                res.locals.previewStatus = getPreviewStatus(blogDetail.result);
            }

            next();
        }
    } catch (error) {
        next();
    }
}

function injectMerchandise({ locale = false, showAll = false }) {
    return async (req, res, next) => {
        try {
            const localeToUse = locale ? locale : req.i18n.getLocale();
            res.locals.availableItems = await contentApi.getMerchandise(localeToUse, showAll);
            next();
        } catch (error) {
            next(error);
        }
    };
}

function injectProfiles(section) {
    return async function(req, res, next) {
        try {
            res.locals.profiles = await contentApi.getProfiles({
                locale: req.i18n.getLocale(),
                section: section
            });
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
    injectStrategicProgramme,
    injectStrategicProgrammes,
    injectResearch,
    injectResearchEntry,
    injectHeroImage,
    injectListingContent,
    injectMerchandise,
    injectProfiles
};
