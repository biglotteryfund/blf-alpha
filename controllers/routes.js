'use strict';

const { basicContent, flexibleContent, staticPage } = require('./common');

/**
 * @typedef {object} Route
 * @property {string} path
 * @property {string} [lang]
 * @property {string} [heroSlug]
 * @property {function} [router]
 * @property {boolean} [isDraft]
 * @property {boolean} [excludeFromSitemap]
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
            heroSlug: 'cruse-bereavement-care-new',
            router: staticPage({
                disableLanguageLink: true,
                template: 'static-pages/region'
            })
        },
        {
            path: '/wales',
            lang: 'toplevel.wales',
            heroSlug: 'the-outdoor-partnership-new',
            router: staticPage({
                template: 'static-pages/region'
            })
        },
        {
            path: '/data',
            lang: 'toplevel.data',
            heroSlug: 'fsn-new',
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
            path: '/user',
            router: require('./user'),
            excludeFromSitemap: true
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
            router: require('./funding')
        },
        {
            path: '/under10k',
            lang: 'funding.under10k',
            heroSlug: 'funding-under-10k-new',
            router: staticPage({
                template: 'static-pages/under10k',
                projectStorySlugs: ['hapani', 'niid', 'new-routes']
            })
        },
        {
            path: '/over10k',
            lang: 'funding.over10k',
            heroSlug: 'headway-new',
            router: staticPage({
                template: 'static-pages/over10k',
                projectStorySlugs: ['kvin', 'shettleston', 'rosies-trust']
            })
        },
        {
            path: '/programmes',
            router: require('./programmes')
        },
        {
            path: '/strategic-investments',
            router: require('./strategic-investments')
        },
        {
            path: '/the-big-lunch',
            router: basicContent()
        },
        {
            path: '/grants',
            router: require('./grants')
        },
        {
            path:
                '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
            lang: 'funding.guidance.logos',
            router: basicContent({
                customTemplate: 'static-pages/logos'
            })
        },
        {
            path:
                '/funding-guidance/managing-your-funding/ordering-free-materials',
            router: require('./materials')
        },
        {
            path: '/funding-guidance/*',
            router: basicContent()
        }
    ]
};

/**
 * Insights section
 * @type {Section}
 */
const insights = {
    path: '/insights',
    showInNavigation: true,
    langTitlePath: 'global.nav.insights',
    pages: [
        {
            path: '/',
            router: require('./insights')
        }
    ]
};

/**
 * Talk to us section
 * @type {Section}
 */
const talk = {
    path: '/contact',
    showInNavigation: false,
    pages: [
        {
            path: '/',
            router: basicContent()
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
            path: '/our-people',
            lang: 'about.ourPeople',
            router: require('./our-people')
        },
        {
            path: '/*',
            router: basicContent()
        }
    ]
};

/**
 * Updates section
 * @type {Section}
 */
const updates = {
    path: '/news',
    showInNavigation: false,
    langTitlePath: 'global.nav.updates',
    pages: [
        {
            path: '/',
            router: require('./updates')
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
    insights: insights,
    talk: talk,
    about: about,
    updates: updates
};

module.exports = {
    sections
};
