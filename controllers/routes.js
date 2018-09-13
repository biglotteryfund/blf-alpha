'use strict';

const { basicContent, flexibleContent, staticPage } = require('./common');

/**
 * @typedef {object} Route
 * @property {string} path
 * @property {string} [heroSlug]
 * @property {function} [router]
 * @property {boolean} [isDraft]
 */

/**
 * @typedef {object} Section
 * @property {string} path
 * @property {boolean} showInNavigation
 * @property {string} [langTitlePath]
 * @property {Array<Route>} routes
 */

/**
 * Home and top-level routes
 * @type {Section}
 */
const toplevel = {
    path: '',
    showInNavigation: true,
    langTitlePath: 'global.nav.home',
    routes: [
        {
            path: '/',
            router: require('./home')
        },
        {
            path: '/apply',
            router: require('./apply')
        },
        {
            path: '/northern-ireland',
            heroSlug: 'down-right-brilliant',
            router: staticPage({
                template: 'static-pages/region',
                lang: 'toplevel.northernIreland',
                isBilingual: false
            })
        },
        {
            path: '/wales',
            heroSlug: 'grassroots-wales',
            router: staticPage({
                template: 'static-pages/region',
                lang: 'toplevel.wales'
            })
        },
        {
            path: '/contact',
            router: basicContent()
        },
        {
            path: '/data',
            heroSlug: 'young-shoulders-programme',
            router: require('./data')
        },
        {
            path: '/jobs*',
            router: basicContent()
        },
        {
            path: '/search',
            router: require('./search')
        }
    ]
};

/**
 * Funding section
 * @type {Section}
 */
const funding = {
    path: '/funding',
    showInNavigation: true,
    langTitlePath: 'global.nav.funding',
    routes: [
        {
            path: '/',
            heroSlug: 'active-plus-communities',
            router: require('./funding')
        },
        {
            path: '/test',
            heroSlug: 'ragroof-players',
            isDraft: true,
            router: staticPage({
                lang: 'toplevel.funding',
                template: 'static-pages/funding-test'
            })
        },
        {
            path: '/thinking-of-applying',
            heroSlug: 'building-bridges',
            isDraft: true,
            router: staticPage({
                template: 'static-pages/thinking-of-applying',
                lang: 'funding.thinkingOfApplying'
            })
        },
        {
            path: '/under10k',
            heroSlug: 'friends-of-greenwich',
            router: staticPage({
                template: 'static-pages/under10k',
                lang: 'funding.under10k',
                caseStudies: ['papyrus', 'ragroof-players', 'welsh-refugee-council']
            })
        },
        {
            path: '/over10k',
            heroSlug: 'passion-4-fusion-3',
            router: staticPage({
                template: 'static-pages/over10k',
                lang: 'funding.over10k',
                caseStudies: ['croxteth-gems', 'dads-in-mind', 'cruse-bereavement-care']
            })
        },
        {
            path: '/programmes',
            heroSlug: 'the-young-foundation',
            router: require('./programmes')
        },
        {
            path: '/programmes/closed',
            heroSlug: 'the-young-foundation'
        },
        {
            path: '/programmes/building-better-opportunities/guide-to-delivering-european-funding',
            router: basicContent()
        },
        {
            path: '/programmes/building-better-opportunities/building-better-opportunities-resources',
            router: basicContent()
        },
        {
            path: '/strategic-investments',
            router: require('./strategic-investments')
        },
        {
            path: '/funding-finder',
            router: require('./funding-finder')
        },
        {
            path: '/past-grants',
            heroSlug: 'active-plus-communities',
            router: staticPage({
                template: 'static-pages/past-grants',
                lang: 'funding.pastGrants'
            })
        },
        {
            path: '/search-past-grants-alpha',
            isDraft: true,
            router: require('./past-grants')
        },
        {
            path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
            router: basicContent({
                lang: 'funding.guidance.logos',
                customTemplate: 'static-pages/logos'
            })
        },
        {
            path: '/funding-guidance/managing-your-funding/ordering-free-materials',
            router: require('./materials')
        },
        {
            path: '/funding-guidance/*',
            router: basicContent()
        }
    ]
};

/**
 * Local section
 * @type {Section}
 */
const local = {
    path: '/local',
    langTitlePath: 'global.nav.local',
    showInNavigation: false,
    routes: [
        {
            path: '/',
            heroSlug: 'arkwright-meadows',
            isDraft: true,
            router: staticPage({
                template: 'static-pages/local',
                lang: 'toplevel.local',
                isBilingual: false
            })
        }
    ]
};

/**
 * Research section
 * @type {Section}
 */
const research = {
    path: '/research',
    showInNavigation: true,
    langTitlePath: 'global.nav.research',
    routes: [
        {
            path: '/',
            router: require('./research')
        }
    ]
};

/**
 * About section
 * @type {Section}
 */
const about = {
    path: '/about',
    showInNavigation: true,
    langTitlePath: 'global.nav.about',
    routes: [
        {
            path: '/',
            router: flexibleContent()
        },
        {
            path: '/our-people/senior-management-team',
            heroSlug: 'mental-health-foundation',
            router: require('./profiles')({
                lang: 'about.ourPeople.seniorManagement',
                profilesSection: 'seniorManagementTeam'
            })
        },
        {
            path: '/ebulletin',
            heroSlug: 'street-dreams',
            router: require('./ebulletin')
        },
        {
            path: '/*',
            router: basicContent()
        }
    ]
};

/**
 * Blog section
 * @type {Section}
 */
const blog = {
    path: '/blog',
    showInNavigation: false,
    langTitlePath: 'global.nav.blog',
    routes: [
        {
            path: '/',
            router: require('./blog'),
            isDraft: true
        }
    ]
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
    { path: '/api/contrast/*', queryStrings: ['url'] },
    { path: '/funding/funding-finder', isPostable: true, allowAllQueryStrings: true, isBilingual: true },
    { path: '/funding/programmes', queryStrings: ['location', 'amount', 'min', 'max'], isBilingual: true },
    { path: '/funding/search-past-grants-alpha', isPostable: true, allowAllQueryStrings: true, isBilingual: true },
    { path: '/search', allowAllQueryStrings: true, isBilingual: true },
    { path: '/user/*', isPostable: true, queryStrings: ['token'] }
];

module.exports = {
    cloudfrontRules,
    sections
};
