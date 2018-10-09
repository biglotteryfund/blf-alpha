'use strict';

const { basicContent, flexibleContent, staticPage } = require('./common');

/**
 * @typedef {object} Route
 * @property {string} path
 * @property {string} [lang]
 * @property {string} [heroSlug]
 * @property {function} [router]
 * @property {boolean} [isDraft]
 */

/**
 * @typedef {object} Section
 * @property {string} path
 * @property {boolean} showInNavigation
 * @property {string} [langTitlePath]
 * @property {Array<Route>} pages
 */

/**
 * Home and top-level routes
 * @type {Section}
 */
const toplevel = {
    path: '',
    showInNavigation: true,
    langTitlePath: 'global.nav.home',
    pages: [
        {
            path: '/',
            lang: 'toplevel.home',
            router: require('./home')
        },
        {
            path: '/northern-ireland',
            lang: 'toplevel.northernIreland',
            heroSlug: 'down-right-brilliant',
            router: staticPage({
                disableLanguageLink: true,
                template: 'static-pages/region'
            })
        },
        {
            path: '/wales',
            lang: 'toplevel.wales',
            heroSlug: 'grassroots-wales',
            router: staticPage({
                template: 'static-pages/region'
            })
        },
        {
            path: '/contact',
            router: basicContent()
        },
        {
            path: '/data',
            lang: 'toplevel.data',
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
        },
        {
            path: '/apply',
            router: require('./apply')
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
    pages: [
        {
            path: '/',
            lang: 'toplevel.funding',
            heroSlug: 'active-plus-communities',
            router: require('./funding')
        },
        {
            path: '/test',
            lang: 'toplevel.funding',
            heroSlug: 'ragroof-players',
            isDraft: true,
            router: staticPage({
                template: 'static-pages/funding-test'
            })
        },
        {
            path: '/thinking-of-applying',
            lang: 'funding.thinkingOfApplying',
            heroSlug: 'building-bridges',
            isDraft: true,
            router: staticPage({
                template: 'static-pages/thinking-of-applying'
            })
        },
        {
            path: '/under10k',
            lang: 'funding.under10k',
            heroSlug: 'friends-of-greenwich',
            router: staticPage({
                template: 'static-pages/under10k',
                caseStudies: ['papyrus', 'ragroof-players', 'welsh-refugee-council']
            })
        },
        {
            path: '/over10k',
            lang: 'funding.over10k',
            heroSlug: 'passion-4-fusion-3',
            router: staticPage({
                template: 'static-pages/over10k',
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
            lang: 'funding.pastGrants',
            heroSlug: 'active-plus-communities',
            router: staticPage({
                template: 'static-pages/past-grants'
            })
        },
        {
            path: '/search-past-grants-alpha',
            isDraft: true,
            router: require('./past-grants')
        },
        {
            path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
            lang: 'funding.guidance.logos',
            router: basicContent({
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
    pages: [
        {
            path: '/',
            lang: 'toplevel.local',
            heroSlug: 'arkwright-meadows',
            isDraft: true,
            router: staticPage({
                disableLanguageLink: true,
                template: 'static-pages/local'
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
    pages: [
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
    pages: [
        {
            path: '/',
            router: flexibleContent()
        },
        {
            path: '/our-people/senior-management-team',
            lang: 'about.ourPeople.seniorManagement',
            heroSlug: 'mental-health-foundation',
            router: require('./profiles')({
                profilesSection: 'seniorManagementTeam'
            })
        },
        {
            path: '/ebulletin',
            lang: 'toplevel.ebulletin',
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
    pages: [
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

module.exports = {
    sections
};
