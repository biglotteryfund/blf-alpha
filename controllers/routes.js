'use strict';

const { basicContent, flexibleContent, staticPage } = require('./common');

/**
 * @typedef {object} Route
 * @property {string} path
 * @property {string} [lang]
 * @property {string} [heroSlug]
 * @property {string} [heroSlugNew]
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
            heroSlug: 'cruse-bereavement-care',
            router: staticPage({
                disableLanguageLink: true,
                template: 'static-pages/region'
            })
        },
        {
            path: '/wales',
            lang: 'toplevel.wales',
            heroSlug: 'the-outdoor-partnership-wales',
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
            router: require('./funding')
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
            path: '/strategic-investments',
            router: require('./strategic-investments')
        },
        {
            path: '/funding-finder',
            router: require('./funding-finder')
        },
        {
            path: '/grants',
            router: require('./grants')
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
            path: '/our-people',
            lang: 'about.ourPeople',
            router: require('./our-people')
        },
        {
            path: '/ebulletin',
            lang: 'toplevel.ebulletin',
            heroSlug: 'the-outdoor-partnership',
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
            router: require('./blog')
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
    research: research,
    about: about,
    blog: blog,
    updates: updates
};

module.exports = {
    sections
};
