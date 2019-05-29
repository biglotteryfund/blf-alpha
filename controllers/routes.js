'use strict';

const { basicContent, flexibleContent, staticPage } = require('./common');

/**
 * @typedef {object} Route
 * @property {string} path
 * @property {string} [heroSlug]
 * @property {function} [router]
 */

/**
 * @typedef {object} Section
 * @property {string} path
 * @property {Array<Route>} pages
 */

/**
 * Home and top-level routes
 * @type {Section}
 */
const toplevel = {
    path: '',
    pages: [
        {
            path: '/',
            router: require('./home')
        },
        {
            path: '/northern-ireland',
            heroSlug: 'cruse-bereavement-care-new',
            router: staticPage({
                lang: 'toplevel.northernIreland',
                disableLanguageLink: true,
                template: 'static-pages/region'
            })
        },
        {
            path: '/wales',
            heroSlug: 'the-outdoor-partnership-new',
            router: staticPage({
                lang: 'toplevel.wales',
                template: 'static-pages/region'
            })
        },
        {
            path: '/data',
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
            router: require('./user')
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
    pages: [
        {
            path: '/',
            router: require('./funding')
        },
        {
            path: '/under10k',
            heroSlug: 'funding-under-10k-new',
            router: staticPage({
                lang: 'funding.under10k',
                template: 'static-pages/under10k',
                projectStorySlugs: ['hapani', 'niid', 'new-routes']
            })
        },
        {
            path: '/over10k',
            heroSlug: 'headway-new',
            router: staticPage({
                lang: 'funding.over10k',
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
            path: `/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos`,
            router: basicContent({
                lang: 'funding.guidance.logos',
                customTemplate: 'static-pages/logos'
            })
        },
        {
            path: `/funding-guidance/managing-your-funding/ordering-free-materials`,
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
    pages: [
        {
            path: '/',
            router: flexibleContent()
        },
        {
            path: '/our-people',
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
    pages: [
        {
            path: '/',
            router: require('./updates')
        }
    ]
};

module.exports = {
    toplevel: toplevel,
    funding: funding,
    insights: insights,
    talk: talk,
    about: about,
    updates: updates
};
