'use strict';

const aliases = require('./aliases');
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
            lang: 'toplevel.home',
            router: require('./home')
        },
        apply: {
            path: '/apply',
            router: require('./apply')
        },
        northernIreland: {
            path: '/northern-ireland',
            lang: 'toplevel.northernIreland',
            heroSlug: 'down-right-brilliant',
            router: staticPage({
                disableLanguageLink: true,
                template: 'static-pages/region'
            })
        },
        wales: {
            path: '/wales',
            lang: 'toplevel.wales',
            heroSlug: 'grassroots-wales',
            router: staticPage({
                template: 'static-pages/region'
            })
        },
        contact: {
            path: '/contact',
            router: basicContent()
        },
        data: {
            path: '/data',
            lang: 'toplevel.data',
            heroSlug: 'young-shoulders-programme',
            router: require('./data')
        },
        jobs: {
            path: '/jobs*',
            router: basicContent()
        },
        search: {
            path: '/search',
            router: require('./search')
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
    pages: {
        root: {
            path: '/',
            lang: 'toplevel.funding',
            heroSlug: 'active-plus-communities',
            router: require('./funding')
        },
        rootTest: {
            path: '/test',
            lang: 'toplevel.funding',
            heroSlug: 'ragroof-players',
            isDraft: true,
            router: staticPage({
                template: 'static-pages/funding-test'
            })
        },
        thinkingOfApplying: {
            path: '/thinking-of-applying',
            lang: 'funding.thinkingOfApplying',
            heroSlug: 'building-bridges',
            isDraft: true,
            router: staticPage({
                template: 'static-pages/thinking-of-applying'
            })
        },
        under10k: {
            path: '/under10k',
            lang: 'funding.under10k',
            heroSlug: 'friends-of-greenwich',
            router: staticPage({
                template: 'static-pages/under10k',
                caseStudies: ['papyrus', 'ragroof-players', 'welsh-refugee-council']
            })
        },
        over10k: {
            path: '/over10k',
            lang: 'funding.over10k',
            heroSlug: 'passion-4-fusion-3',
            router: staticPage({
                template: 'static-pages/over10k',
                caseStudies: ['croxteth-gems', 'dads-in-mind', 'cruse-bereavement-care']
            })
        },
        programmes: {
            path: '/programmes',
            lang: 'funding.programmes',
            heroSlug: 'the-young-foundation',
            queryStrings: ['location', 'amount', 'min', 'max'],
            router: require('./programmes')
        },
        programmesClosed: {
            path: '/programmes/closed',
            lang: 'funding.programmesClosed',
            heroSlug: 'the-young-foundation'
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
        strategicInvestments: {
            path: '/strategic-investments',
            router: require('./strategic-investments')
        },
        fundingFinder: {
            path: '/funding-finder',
            router: require('./funding-finder')
        },
        pastGrants: {
            path: '/past-grants',
            lang: 'funding.pastGrants',
            heroSlug: 'active-plus-communities',
            router: staticPage({
                template: 'static-pages/past-grants'
            })
        },
        pastGrantsAlpha: {
            path: '/search-past-grants-alpha',
            isDraft: true,
            template: 'pages/grants/search',
            router: require('./past-grants')
        },
        fundingGuidanceLogos: {
            path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
            lang: 'funding.guidance.logos',
            router: basicContent({
                customTemplate: 'static-pages/logos'
            })
        },
        fundingGuidanceMaterials: {
            path: '/funding-guidance/managing-your-funding/ordering-free-materials',
            router: require('./materials')
        },
        fundingGuidance: {
            path: '/funding-guidance/*',
            router: basicContent()
        }
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
                template: 'static-pages/local'
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
    pages: {
        root: {
            path: '/',
            router: flexibleContent()
        },
        seniorManagement: {
            path: '/our-people/senior-management-team',
            lang: 'about.ourPeople.seniorManagement',
            heroSlug: 'mental-health-foundation',
            router: require('./profiles')({
                profilesSection: 'seniorManagementTeam'
            })
        },
        ebulletin: {
            path: '/ebulletin',
            lang: 'toplevel.ebulletin',
            heroSlug: 'street-dreams',
            router: require('./ebulletin')
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
 * Sections
 * The order here defines the order of the navigation
 */
const sections = {
    toplevel: toplevel,
    funding: funding,
    local: local,
    research: research,
    about: about,
    blog: blog
};

/**
 * Custom cloudfront rules
 * If any cached url paths need custom cloudfront rules like query strings
 * or custom cookies to be whitelisted you must define those rules here.
 */
const cloudfrontRules = [
    { path: '*~/link.aspx', isPostable: true, allowAllQueryStrings: true },
    { path: '/contrast/*', queryStrings: ['url'] },
    { path: '/funding/funding-finder', isPostable: true, allowAllQueryStrings: true, isBilingual: true },
    { path: '/funding/programmes', queryStrings: ['location', 'amount', 'min', 'max'], isBilingual: true },
    { path: '/funding/search-past-grants-alpha', isPostable: true, allowAllQueryStrings: true, isBilingual: true },
    { path: '/search', allowAllQueryStrings: true, isBilingual: true },
    { path: '/user/*', isPostable: true, queryStrings: ['token'] }
];

module.exports = {
    aliases,
    cloudfrontRules,
    sections
};
