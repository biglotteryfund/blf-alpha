'use strict';

const { basicContent, flexibleContent, staticPage } = require('./common');

/**
 * @typedef {object} Route
 * @property {string} path
 * @property {function} router
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
            router: staticPage({
                template: 'static-pages/region',
                heroSlug: 'down-right-brilliant',
                lang: 'toplevel.northernIreland',
                isBilingual: false
            })
        },
        {
            path: '/wales',
            router: staticPage({
                template: 'static-pages/region',
                heroSlug: 'grassroots-wales',
                lang: 'toplevel.wales'
            })
        },
        {
            path: '/contact',
            router: basicContent()
        },
        {
            path: '/data',
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
            router: require('./funding')
        },
        {
            path: '/test',
            isDraft: true,
            router: staticPage({
                template: 'static-pages/funding-test',
                heroSlug: 'ragroof-players',
                lang: 'toplevel.funding'
            })
        },
        {
            path: '/thinking-of-applying',
            isDraft: true,
            router: staticPage({
                template: 'static-pages/thinking-of-applying',
                heroSlug: 'building-bridges',
                lang: 'funding.thinkingOfApplying'
            })
        },
        {
            path: '/under10k',
            router: staticPage({
                template: 'static-pages/under10k',
                heroSlug: 'friends-of-greenwich',
                lang: 'funding.under10k',
                caseStudies: ['papyrus', 'ragroof-players', 'welsh-refugee-council']
            })
        },
        {
            path: '/over10k',
            router: staticPage({
                template: 'static-pages/over10k',
                heroSlug: 'passion-4-fusion-3',
                lang: 'funding.over10k',
                caseStudies: ['croxteth-gems', 'dads-in-mind', 'cruse-bereavement-care']
            })
        },
        {
            path: '/programmes',
            router: require('./programmes')
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
            router: staticPage({
                template: 'static-pages/past-grants',
                heroSlug: 'active-plus-communities',
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
            isDraft: true,
            router: staticPage({
                heroSlug: 'arkwright-meadows',
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
            router: require('./profiles')({
                lang: 'about.ourPeople.seniorManagement',
                profilesSection: 'seniorManagementTeam'
            })
        },
        {
            path: '/ebulletin',
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
module.exports = {
    toplevel: toplevel,
    funding: funding,
    local: local,
    research: research,
    about: about,
    blog: blog
};
