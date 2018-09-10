'use strict';

const aliases = require('./aliases');
const { sessionRoute, legacyRoute } = require('./route-types');

const { basicContent, flexibleContent, staticPage } = require('./common');

/**
 * @typedef {object} Section
 * @property {string} path
 * @property {boolean} showInNavigation
 * @property {object} pages
 * @property {function} [controller]
 * @property {string} [langTitlePath]
 */

/**
 * Home and top-level routes
 * @type {Section}
 */
const toplevel = {
    path: '',
    showInNavigation: true,
    langTitlePath: 'global.nav.home',
    controller: function(options) {
        return require('./toplevel')(options);
    },
    pages: {
        home: {
            path: '/',
            template: 'pages/toplevel/home',
            lang: 'toplevel.home',
            isPostable: true
        },
        northernIreland: {
            path: '/northern-ireland',
            lang: 'toplevel.northernIreland',
            heroSlug: 'down-right-brilliant',
            router: staticPage({
                disableLanguageLink: true,
                template: 'pages/toplevel/region'
            })
        },
        wales: {
            path: '/wales',
            lang: 'toplevel.wales',
            heroSlug: 'grassroots-wales',
            router: staticPage({
                template: 'pages/toplevel/region'
            })
        },
        contact: {
            path: '/contact',
            router: basicContent()
        },
        data: {
            path: '/data',
            template: 'pages/toplevel/data',
            lang: 'toplevel.data',
            heroSlug: 'young-shoulders-programme'
        },
        jobs: {
            path: '/jobs*',
            router: basicContent()
        },
        search: {
            path: '/search',
            allowAllQueryStrings: true
        },
        patterns: {
            path: '/patterns',
            router: require('./pattern-library')
        }
    }
};

/**
 * Funding section
 * @type {Section}
 */
const funding = {
    path: '/funding',
    showInNavigation: true,
    langTitlePath: 'global.nav.funding',
    controller: function(options) {
        return require('./funding')(options);
    },
    pages: {
        root: {
            path: '/',
            sMaxAge: '30m',
            template: 'pages/funding/index',
            lang: 'toplevel.funding',
            heroSlug: 'active-plus-communities'
        },
        rootTest: {
            path: '/test',
            lang: 'toplevel.funding',
            heroSlug: 'ragroof-players',
            isDraft: true,
            router: staticPage({
                template: 'pages/funding/index-test'
            })
        },
        thinkingOfApplying: {
            path: '/thinking-of-applying',
            lang: 'funding.thinkingOfApplying',
            heroSlug: 'building-bridges',
            isDraft: true,
            router: staticPage({
                template: 'pages/funding/thinking-of-applying'
            })
        },
        under10k: {
            path: '/under10k',
            template: 'pages/funding/under10k',
            lang: 'funding.under10k',
            heroSlug: 'friends-of-greenwich'
        },
        over10k: {
            path: '/over10k',
            template: 'pages/funding/over10k',
            lang: 'funding.over10k',
            heroSlug: 'passion-4-fusion-3'
        },
        pastGrants: {
            path: '/past-grants',
            lang: 'funding.pastGrants',
            heroSlug: 'active-plus-communities',
            router: staticPage({
                template: 'pages/funding/past-grants'
            })
        },
        pastGrantsAlpha: {
            path: '/search-past-grants-alpha',
            isDraft: true,
            template: 'pages/grants/search',
            isPostable: true,
            allowAllQueryStrings: true
        },
        programmes: {
            path: '/programmes',
            template: 'pages/funding/programmes',
            lang: 'funding.programmes',
            heroSlug: 'the-young-foundation',
            queryStrings: ['location', 'amount', 'min', 'max']
        },
        programmeDetail: {
            path: '/programmes/*',
            template: 'pages/funding/programme-detail'
        },
        buildingBetterOpportunities: {
            path: '/programmes/building-better-opportunities/guide-to-delivering-european-funding',
            router: basicContent()
        },
        buildingBetterOpportunitiesResources: {
            path: '/programmes/building-better-opportunities/building-better-opportunities-resources',
            router: basicContent()
        },
        fundingGuidanceLogos: {
            path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
            lang: 'funding.guidance.logos',
            router: basicContent({ customTemplate: 'pages/funding/logos' })
        },
        fundingGuidanceMaterials: sessionRoute({
            path: '/funding-guidance/managing-your-funding/ordering-free-materials',
            lang: 'funding.guidance.order-free-materials',
            isPostable: true
        }),
        fundingGuidanceMaterialsActions: sessionRoute({
            path: '/funding-guidance/managing-your-funding/ordering-free-materials/*',
            isPostable: true
        }),
        fundingGuidance: {
            path: '/funding-guidance/*',
            router: basicContent()
        },
        fundingFinderLegacy: legacyRoute({
            path: '/funding-finder'
        })
    }
};

/**
 * Local section
 * @type {Section}
 */
const local = {
    path: '/local',
    langTitlePath: 'global.nav.local',
    showInNavigation: false,
    pages: {
        root: {
            path: '/',
            lang: 'toplevel.local',
            heroSlug: 'arkwright-meadows',
            isDraft: true,
            router: staticPage({
                disableLanguageLink: true,
                template: 'pages/toplevel/local'
            })
        }
    }
};

/**
 * Research section
 * @type {Section}
 */
const research = {
    path: '/research',
    showInNavigation: true,
    langTitlePath: 'global.nav.research',
    controller: function(options) {
        return require('./research')(options);
    },
    pages: {
        root: {
            path: '/',
            lang: 'toplevel.research',
            heroSlug: 'grassroots-project'
        },
        rootNew: {
            path: '/landing-new',
            lang: 'toplevel.research',
            heroSlug: 'grassroots-project',
            isDraft: true
        }
    }
};

/**
 * About section
 * @type {Section}
 */
const about = {
    path: '/about',
    showInNavigation: true,
    langTitlePath: 'global.nav.about',
    controller: function(options) {
        return require('./about')(options);
    },
    pages: {
        root: {
            path: '/',
            router: flexibleContent()
        },
        seniorManagement: {
            path: '/our-people/senior-management-team',
            template: 'pages/about/senior-management-team',
            lang: 'about.ourPeople.seniorManagement',
            heroSlug: 'mental-health-foundation'
        },
        board: {
            path: '/our-people/board',
            template: 'pages/about/board',
            lang: 'about.ourPeople.board',
            isDraft: true
        },
        ebulletin: {
            path: '/ebulletin',
            template: 'pages/about/ebulletin',
            lang: 'toplevel.ebulletin',
            heroSlug: 'street-dreams',
            isPostable: true
        },
        content: {
            path: '/*',
            router: basicContent()
        }
    }
};

/**
 * Blog section
 * @type {Section}
 */
const blog = {
    path: '/blog',
    showInNavigation: false,
    langTitlePath: 'global.nav.blog',
    pages: {
        root: {
            path: '/',
            router: require('./blog'),
            isDraft: true
        }
    }
};

/**
 * Apply section
 * @type {Section}
 */
const apply = {
    path: '/apply',
    showInNavigation: false,
    controller: function(options) {
        return require('./apply')(options);
    },
    pages: {
        root: {
            path: '/'
        },
        applicationForms: sessionRoute({
            path: '/*',
            isPostable: true
        })
    }
};

/**
 * Sections
 * The order here defines the order of the navigation
 */
const sections = {
    toplevel: toplevel,
    funding: funding,
    local: local,
    research: research,
    about: about,
    blog: blog,
    apply: apply
};

/**
 * Other Routes
 * These are other paths that should be routed to this app via Cloudfront
 * but aren't explicit page routes (eg. static files, custom pages etc)
 */
const otherUrls = [
    sessionRoute({ path: '/tools/*', isPostable: true }),
    { path: '/contrast/*', queryStrings: ['url'] },
    sessionRoute({ path: '/user/*', isPostable: true, queryStrings: ['token'] }),
    legacyRoute({ path: '*~/link.aspx' })
];

/**
 * Archived Routes
 * Paths in this array will be redirected to the National Archives
 */
const archivedRoutes = [
    { path: '/funding/funding-guidance/applying-for-funding/*' },
    { path: '/about-big/10-big-lottery-fund-facts' }
];

module.exports = {
    aliases,
    archivedRoutes,
    otherUrls,
    sections
};
