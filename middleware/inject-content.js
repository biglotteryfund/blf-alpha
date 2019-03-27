'use strict';
const { pick, clone } = require('lodash');
const { flatten, get, getOr } = require('lodash/fp');
const moment = require('moment');
const Raven = require('raven');

const { localify } = require('../modules/urls');
const contentApi = require('../services/content-api');

/*
 * Populate hero image (with social image URLs too)
 * */
function setHeroLocals({ res, entry }) {
    // @TODO: Rename this once API has been updated back to `hero`
    const heroImage = get('heroNew.image')(entry);
    const heroCredit = get('heroNew.credit')(entry);

    if (heroImage) {
        res.locals.pageHero = {
            image: heroImage,
            credit: heroCredit
        };
        res.locals.socialImage = heroImage;
    } else {
        res.locals.pageHero = null;
    }
}

/**
 * Sets locals that are common to many entries.
 * - title based on content
 * - isBilingual based on availableLanguages property
 * - preview status metadata
 * - pageHero (with optional fallback)
 * - optional custom theme colour
 */
function setCommonLocals({ res, entry }) {
    res.locals.title = entry.title;

    res.locals.isBilingual = entry.availableLanguages.length === 2;
    res.locals.openGraph = get(entry, 'openGraph', false);

    res.locals.previewStatus = {
        isDraftOrVersion: entry.status === 'draft' || entry.status === 'version',
        lastUpdated: moment(entry.dateUpdated.date).format('Do MMM YYYY [at] h:mma')
    };

    setHeroLocals({ res, entry });
}

function injectHeroImage(heroSlug) {
    return async function(req, res, next) {
        if (heroSlug) {
            const { fallbackHeroImage } = res.locals;

            // Set defaults
            res.locals.pageHero = { image: fallbackHeroImage };
            res.locals.socialImage = fallbackHeroImage;

            try {
                const image = await contentApi.getHeroImage({
                    locale: req.i18n.getLocale(),
                    slug: heroSlug
                });

                res.locals.pageHero = { image: image };
                res.locals.socialImage = image;
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

function injectCopy(lang) {
    return function(req, res, next) {
        if (lang) {
            const copy = req.i18n.__(lang);
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

        const ancestors = res.locals.customAncestors || getOr([], 'ancestors')(res.locals.content);
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
        let query = {};
        if (req.query.social) {
            query.social = req.query.social;
        }
        const content = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            previewMode: res.locals.PREVIEW_MODE || false,
            query: query
        });

        if (content) {
            res.locals.content = content;
            setCommonLocals({ res, entry: content });
        }

        next();
    } catch (error) {
        next(error);
    }
}

async function injectFlexibleContent(req, res, next) {
    try {
        let query = {};
        if (req.query.social) {
            query.social = req.query.social;
        }
        const content = await contentApi.getFlexibleContent({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            previewMode: res.locals.PREVIEW_MODE || false,
            query: query
        });

        if (content) {
            res.locals.content = content;
            setCommonLocals({ res, entry: content });
        }

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * Inject funding programme detail
 * Assumes a parameter of :slug in the request
 */
async function injectFundingProgramme(req, res, next) {
    try {
        let query = {};
        if (req.query.social) {
            query.social = req.query.social;
        }

        const entry = await contentApi.getFundingProgramme({
            slug: req.params.slug,
            locale: req.i18n.getLocale(),
            previewMode: res.locals.PREVIEW_MODE || false,
            query: query
        });

        res.locals.fundingProgramme = entry;
        setCommonLocals({ res, entry });
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectStrategicProgramme(req, res, next) {
    try {
        // Assumes a parameter of :slug in the request
        const { slug } = req.params;
        let query = {};
        if (req.query.social) {
            query.social = req.query.social;
        }
        if (slug) {
            const entry = await contentApi.getStrategicProgrammes({
                slug: slug,
                locale: req.i18n.getLocale(),
                previewMode: res.locals.PREVIEW_MODE || false,
                query: query
            });

            res.locals.strategicProgramme = entry;
            setCommonLocals({ res, entry });
        }
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectStrategicProgrammes(req, res, next) {
    try {
        res.locals.strategicProgrammes = await contentApi.getStrategicProgrammes({
            locale: req.i18n.getLocale()
        });
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

function injectResearch(researchType = null, pageLimit = null) {
    return async (req, res, next) => {
        try {
            let query = {};
            if (researchType === 'documents') {
                // Add in any allowed filters
                query = pick(req.query, ['page', 'programme', 'tag', 'doctype', 'portfolio', 'q', 'sort']);
                res.locals.queryParams = clone(query);
                if (pageLimit) {
                    query['page-limit'] = pageLimit;
                }
            }

            const research = await contentApi.getResearch({
                locale: req.i18n.getLocale(),
                previewMode: res.locals.PREVIEW_MODE || false,
                type: researchType,
                query: query
            });
            res.locals.researchEntries = research.result;
            res.locals.researchMeta = research.meta;
            next();
        } catch (error) {
            if (error.statusCode >= 500) {
                next(error);
            } else {
                next();
            }
        }
    };
}

async function injectResearchEntry(req, res, next) {
    try {
        // Assumes a parameter of :slug in the request
        const { slug } = req.params;
        if (slug) {
            let query = {};
            if (req.query.social) {
                query.social = req.query.social;
            }

            const entry = await contentApi.getResearch({
                slug: slug,
                locale: req.i18n.getLocale(),
                previewMode: res.locals.PREVIEW_MODE || false,
                query: query
            });

            res.locals.researchEntry = entry;
            setCommonLocals({ res, entry });
        }
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectOurPeople(req, res, next) {
    try {
        res.locals.ourPeople = await contentApi.getOurPeople({
            locale: req.i18n.getLocale(),
            previewMode: res.locals.PREVIEW_MODE || false
        });

        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectBlogPosts(req, res, next) {
    try {
        res.locals.blogPosts = await contentApi.getBlogPosts({
            locale: req.i18n.getLocale(),
            previewMode: res.locals.PREVIEW_MODE || false,
            page: req.query.page || 1
        });
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
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
                setCommonLocals({ res, entry: blogDetail.result });
            }

            next();
        }
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

function injectMerchandise({ locale = null, showAll = false }) {
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

module.exports = {
    injectBlogDetail,
    injectBlogPosts,
    injectBreadcrumbs,
    injectCopy,
    injectFlexibleContent,
    injectFundingProgramme,
    injectHeroImage,
    injectListingContent,
    injectMerchandise,
    injectOurPeople,
    injectResearch,
    injectResearchEntry,
    injectStrategicProgramme,
    injectStrategicProgrammes,
    setCommonLocals,
    setHeroLocals
};
