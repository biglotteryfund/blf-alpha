'use strict';

const { basicContent, flexibleContent, staticPage } = require('./common');

/**
 * @typedef {object} Section
 * @property {string} path
 * @property {Array<{ path: string, router: function }>} pages
 */

/**
 * Home and top-level routes
 */
const toplevel = {
    path: '',
    pages: [
        {
            path: '/',
            router: require('./home')
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
        },
        {
            path: '/user',
            router: require('./user')
        }
    ]
};

/**
 * Funding section
 * @type {Section}
 */
let funding = {
    path: '/funding',
    pages: [
        {
            path: '/',
            router: require('./funding')
        },
        {
            path: '/under10k',
            router: staticPage({
                lang: 'funding.under10k',
                template: 'static-pages/under10k',
                heroSlug: 'funding-under-10k-new',
                projectStorySlugs: ['hapani', 'niid', 'new-routes']
            })
        },
        {
            path: '/over10k',
            router: staticPage({
                lang: 'funding.over10k',
                template: 'static-pages/over10k',
                heroSlug: 'headway-new',
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
            path: '/funding-guidance/*',
            router: basicContent()
        },
        {
            path: `/managing-your-grant/promoting-your-project/order-free-materials`,
            router: require('./materials')
        },
        {
            path: `/managing-your-grant/promoting-your-project/download-our-logo`,
            router: basicContent({
                lang: 'funding.guidance.logos',
                customTemplate: 'static-pages/logos'
            })
        },
        {
            path: '/*',
            router: basicContent({
                cmsPage: true
            })
        }
    ]
};

/**
 * Insights section
 * @type {Section}
 */
const insights = {
    path: '/insights',
    pages: [{ path: '/', router: require('./insights') }]
};

/**
 * Talk to us section
 * @type {Section}
 */
const talk = {
    path: '/contact',
    pages: [{ path: '/', router: basicContent() }]
};

/**
 * About section
 * @type {Section}
 */
const about = {
    path: '/about',
    pages: [
        { path: '/', router: flexibleContent() },
        { path: '/our-people', router: require('./our-people') },
        { path: '/*', router: basicContent() }
    ]
};

/**
 * Updates section
 * @type {Section}
 */
const updates = {
    path: '/news',
    pages: [{ path: '/', router: require('./updates') }]
};

/**
 * Apply section
 * @type {Section}
 */
const apply = {
    path: '/apply',
    pages: [{ path: '/', router: require('./apply') }]
};

module.exports = {
    toplevel: toplevel,
    funding: funding,
    insights: insights,
    talk: talk,
    about: about,
    updates: updates,
    apply: apply
};
