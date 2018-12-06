'use strict';
const { flatten, get, getOr } = require('lodash/fp');
const moment = require('moment');
const Raven = require('raven');

const { localify } = require('../modules/urls');
const contentApi = require('../services/content-api');

/**
 * Sets locals that are common to many entries.
 * - title based on content
 * - isBilingual based on availableLanguages property
 * - preview status metadata
 * - pageHero (with optional fallback)
 * - optional custom theme colour
 */
function setCommonLocals({ res, entry, withFallbackHero = false }) {
    const { useNewBrand, fallbackHeroImage } = res.locals;

    res.locals.title = entry.displayTitle || entry.title;

    res.locals.isBilingual = entry.availableLanguages.length === 2;

    res.locals.previewStatus = {
        isDraftOrVersion: entry.status === 'draft' || entry.status === 'version',
        lastUpdated: moment(entry.dateUpdated.date).format('Do MMM YYYY [at] h:mma')
    };

    const newHeroImage = get('heroNew.image')(entry);
    const newHeroCredit = get('heroNew.credit')(entry);

    if (useNewBrand && newHeroImage) {
        res.locals.pageHero = {
            image: newHeroImage,
            credit: newHeroCredit
        };
    } else if (withFallbackHero) {
        res.locals.pageHero = {
            image: entry.hero || fallbackHeroImage,
            credit: entry.heroCredit
        };
    } else if (entry.hero) {
        res.locals.pageHero = {
            image: entry.hero,
            credit: entry.heroCredit
        };
    } else {
        res.locals.pageHero = null;
    }

    if (entry.themeColour) {
        res.locals.pageAccent = entry.themeColour;
    }
}

function injectHeroImage(heroSlug, heroSlugNew) {
    return async function(req, res, next) {
        if (heroSlug) {
            const { fallbackHeroImage, useNewBrand } = res.locals;

            // Set defaults
            res.locals.pageHero = { image: fallbackHeroImage };
            res.locals.socialImage = fallbackHeroImage;

            try {
                const image = await contentApi.getHeroImage({
                    locale: req.i18n.getLocale(),
                    slug: useNewBrand && heroSlugNew ? heroSlugNew : heroSlug
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
        const content = await contentApi.getListingPage({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            previewMode: res.locals.PREVIEW_MODE || false
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
        const content = await contentApi.getFlexibleContent({
            locale: req.i18n.getLocale(),
            path: req.baseUrl + req.path,
            previewMode: res.locals.PREVIEW_MODE || false
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

/**
 * Inject funding programme detail
 * Assumes a parameter of :slug in the request
 */
async function injectFundingProgramme(req, res, next) {
    try {
        const entry = await contentApi.getFundingProgramme({
            slug: req.params.slug,
            locale: req.i18n.getLocale(),
            previewMode: res.locals.PREVIEW_MODE || false
        });

        res.locals.fundingProgramme = entry;
        setCommonLocals({ res, entry, withFallbackHero: true });
        next();
    } catch (error) {
        if (error.statusCode >= 500) {
            next(error);
        } else {
            next();
        }
    }
}

async function injectFundingProgrammes(req, res, next) {
    try {
        res.locals.fundingProgrammes = await contentApi.getFundingProgrammes({
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

async function injectStrategicProgramme(req, res, next) {
    try {
        // Assumes a parameter of :slug in the request
        const { slug } = req.params;
        if (slug) {
            const entry = await contentApi.getStrategicProgrammes({
                slug: slug,
                locale: req.i18n.getLocale(),
                previewMode: res.locals.PREVIEW_MODE || false
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

async function injectResearch(req, res, next) {
    try {
        res.locals.researchEntries = await contentApi.getResearch({
            locale: req.i18n.getLocale(),
            searchQuery: req.query.q
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
            setCommonLocals({ res, entry, withFallbackHero: true });
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
    injectCaseStudies,
    injectCopy,
    injectFlexibleContent,
    injectFundingProgramme,
    injectFundingProgrammes,
    injectHeroImage,
    injectListingContent,
    injectMerchandise,
    injectOurPeople,
    injectResearch,
    injectResearchEntry,
    injectStrategicProgramme,
    injectStrategicProgrammes,
    setCommonLocals
};
