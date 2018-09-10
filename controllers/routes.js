'use strict';

const aliases = require('./aliases');
const {
    customRoute,
    sessionRoute,
    basicContentRoute,
    flexibleContentRoute,
    legacyRoute
} = require('./route-types');

const { staticPage } = require('./common');

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
        home: customRoute({
            path: '/',
            template: 'pages/toplevel/home',
            lang: 'toplevel.home',
            isPostable: true
        }),
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
        contact: basicContentRoute({
            path: '/contact'
        }),
        data: customRoute({
            path: '/data',
            template: 'pages/toplevel/data',
            lang: 'toplevel.data',
            heroSlug: 'young-shoulders-programme'
        }),
        jobs: basicContentRoute({
            path: '/jobs'
        }),
        jobsBenefits: basicContentRoute({
            path: '/jobs/benefits'
        }),
        search: customRoute({
            path: '/search',
            allowAllQueryStrings: true
        })
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
        root: customRoute({
            path: '/',
            sMaxAge: '30m',
            template: 'pages/funding/index',
            lang: 'toplevel.funding',
            heroSlug: 'active-plus-communities'
        }),
        rootTest: {
            path: '/test',
            lang: 'toplevel.funding',
            heroSlug: 'ragroof-players',
            live: false,
            router: staticPage({
                template: 'pages/funding/index-test'
            })
        },
        thinkingOfApplying: {
            path: '/thinking-of-applying',
            lang: 'funding.thinkingOfApplying',
            heroSlug: 'building-bridges',
            live: false,
            router: staticPage({
                template: 'pages/funding/thinking-of-applying'
            })
        },
        under10k: customRoute({
            path: '/under10k',
            template: 'pages/funding/under10k',
            lang: 'funding.under10k',
            heroSlug: 'friends-of-greenwich'
        }),
        over10k: customRoute({
            path: '/over10k',
            template: 'pages/funding/over10k',
            lang: 'funding.over10k',
            heroSlug: 'passion-4-fusion-3'
        }),
        pastGrants: {
            path: '/past-grants',
            lang: 'funding.pastGrants',
            heroSlug: 'active-plus-communities',
            router: staticPage({
                template: 'pages/funding/past-grants'
            })
        },
        pastGrantsAlpha: customRoute({
            path: '/search-past-grants-alpha',
            live: false,
            template: 'pages/grants/search',
            isPostable: true,
            allowAllQueryStrings: true
        }),
        programmes: customRoute({
            path: '/programmes',
            template: 'pages/funding/programmes',
            lang: 'funding.programmes',
            heroSlug: 'the-young-foundation',
            queryStrings: ['location', 'amount', 'min', 'max']
        }),
        programmeDetail: customRoute({
            path: '/programmes/*',
            template: 'pages/funding/programme-detail'
        }),
        buildingBetterOpportunities: basicContentRoute({
            path: '/programmes/building-better-opportunities/guide-to-delivering-european-funding'
        }),
        buildingBetterOpportunitiesResources: basicContentRoute({
            path: '/programmes/building-better-opportunities/building-better-opportunities-resources'
        }),
        fundingGuidanceLogos: basicContentRoute({
            path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
            template: 'pages/funding/logos',
            lang: 'funding.guidance.logos'
        }),
        fundingGuidanceMaterials: sessionRoute({
            path: '/funding-guidance/managing-your-funding/ordering-free-materials',
            lang: 'funding.guidance.order-free-materials',
            isPostable: true
        }),
        fundingGuidanceMaterialsActions: sessionRoute({
            path: '/funding-guidance/managing-your-funding/ordering-free-materials/*',
            isPostable: true
        }),
        fundingGuidance: basicContentRoute({
            path: '/funding-guidance/*'
        }),
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
            live: false,
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
        root: customRoute({
            path: '/',
            lang: 'toplevel.research',
            heroSlug: 'grassroots-project'
        }),
        rootNew: customRoute({
            path: '/landing-new',
            lang: 'toplevel.research',
            heroSlug: 'grassroots-project',
            live: false
        })
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
        root: flexibleContentRoute({
            path: '/'
        }),
        seniorManagement: customRoute({
            path: '/our-people/senior-management-team',
            template: 'pages/about/senior-management-team',
            lang: 'about.ourPeople.seniorManagement',
            heroSlug: 'mental-health-foundation'
        }),
        board: customRoute({
            path: '/our-people/board',
            template: 'pages/about/board',
            lang: 'about.ourPeople.board',
            live: false
        }),
        ebulletin: customRoute({
            path: '/ebulletin',
            template: 'pages/about/ebulletin',
            lang: 'toplevel.ebulletin',
            heroSlug: 'street-dreams',
            isPostable: true
        }),
        content: basicContentRoute({
            path: '/*'
        })
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
    controller: function(options) {
        return require('./blog')(options);
    },
    pages: {
        root: customRoute({
            path: '/',
            live: false
        }),
        articles: customRoute({
            path: '/*',
            live: false
        })
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
        root: customRoute({
            path: '/'
        }),
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
    customRoute({ path: '/assets/*' }),
    customRoute({ path: '/error' }),
    sessionRoute({ path: '/tools/*', isPostable: true }),
    customRoute({ path: '/contrast/*', queryStrings: ['url'] }),
    sessionRoute({ path: '/user/*', isPostable: true, queryStrings: ['token'] }),
    legacyRoute({ path: '*~/link.aspx' })
];

/**
 * Archived Routes
 * Paths in this array will be redirected to the National Archives
 */
const archivedRoutes = [
    customRoute({ path: '/funding/funding-guidance/applying-for-funding/*' }),
    customRoute({ path: '/about-big/10-big-lottery-fund-facts' })
];

module.exports = {
    aliases,
    archivedRoutes,
    otherUrls,
    sections
};
