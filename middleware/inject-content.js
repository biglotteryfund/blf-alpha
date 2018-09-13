'use strict';
const { flatten, get, getOr } = require('lodash/fp');
const moment = require('moment');

const { localify } = require('../modules/urls');
const contentApi = require('../services/content-api');

/**
 * Sets locals that are common to many enries.
 * - heroImage (with fallback)
 * - title based on content
 * - isBilingual based on availableLanguages property
 * - preview status based on entry and date updated
 */
function setCommonLocals(res, entry) {
    res.locals.title = entry.displayTitle || entry.title;
    res.locals.heroImage = entry.hero;
    res.locals.isBilingual = entry.availableLanguages.length === 2;
    res.locals.previewStatus = {
        isDraftOrVersion: entry.status === 'draft' || entry.status === 'version',
        lastUpdated: moment(entry.dateUpdated.date).format('Do MMM YYYY [at] h:mma')
    };
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
                next();
            }
        } else {
            next();
        }
    };
}

function injectCopy(lang) {
    return function(req, res, next) {
        const copy = lang && req.i18n.__(lang);
        if (copy && typeof copy === 'object') {
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
        setCommonLocals(res, entry);

        next();
    } catch (error) {
        next(error);
    }
}

function injectCaseStudies(caseStudySlugs = []) {
    return async function(req, res, next) {
        if (caseStudySlugs.length > 0) {
            res.locals.caseStudies = await contentApi.getCaseStudies({
                locale: req.i18n.getLocale(),
                slugs: caseStudySlugs
            });

            next();
        } else {
            next();
        }
    };
}

async function injectFundingProgramme(req, res, next) {
    try {
        const entry = await contentApi.getFundingProgramme({
            // Assumes a parameter of :slug in the request
            slug: req.params.slug,
            locale: req.i18n.getLocale(),
            previewMode: res.locals.PREVIEW_MODE || false
        });

        res.locals.entry = entry;
        setCommonLocals(res, entry);
        next();
    } catch (error) {
        next(error);
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
                setCommonLocals(res, blogDetail.result);
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
            next(error);
        }
    };
}

module.exports = {
    injectBlogDetail,
    injectBlogPosts,
    injectBreadcrumbs,
    injectCaseStudies,
    injectCopy,
    injectFlexibleContent,
    injectFundingProgramme,
    injectFundingProgrammes,
    injectHeroImage,
    injectListingContent,
    injectMerchandise,
    injectProfiles,
    injectResearch,
    injectResearchEntry,
    injectStrategicProgramme,
    injectStrategicProgrammes
};
