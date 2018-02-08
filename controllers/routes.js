'use strict';

const path = require('path');
const { legacyRedirects, vanityRedirects } = require('./aliases');
const {
    createSection,
    basicRoute,
    staticRoute,
    dynamicRoute,
    wildcardRoute,
    cmsRoute,
    legacyRoute
} = require('./route-types');

const sections = {
    toplevel: createSection({
        path: '',
        langTitlePath: 'global.nav.home',
        controllerPath: path.resolve(__dirname, './toplevel')
    }),
    funding: createSection({
        path: '/funding',
        langTitlePath: 'global.nav.funding',
        controllerPath: path.resolve(__dirname, './funding')
    }),
    research: createSection({
        path: '/research',
        langTitlePath: 'global.nav.research',
        controllerPath: path.resolve(__dirname, './research')
    }),
    'about-big': createSection({
        path: '/about-big', // @TODO: Rename launching about page
        langTitlePath: 'global.nav.about',
        controllerPath: path.resolve(__dirname, './about')
    })
};

/**
 * Top-level Routes
 */
sections.toplevel.pages = {
    home: dynamicRoute({
        path: '/',
        template: 'pages/toplevel/home',
        lang: 'toplevel.home',
        isPostable: true,
        aliases: [
            '/home',
            '/index.html',
            '/en-gb',
            '/england',
            '/uk-wide',
            '/funding/funding-guidance/applying-for-funding'
        ]
    }),
    contact: staticRoute({
        path: '/contact',
        template: 'pages/toplevel/contact',
        lang: 'toplevel.contact',
        aliases: [
            '/about-big/contact-us',
            '/help-and-support',
            '/england/about-big/contact-us',
            '/wales/about-big/contact-us',
            '/scotland/about-big/contact-us',
            '/northernireland/about-big/contact-us'
        ]
    }),
    data: dynamicRoute({
        path: '/data',
        template: 'pages/toplevel/data',
        lang: 'toplevel.data'
    }),
    jobs: staticRoute({
        path: '/jobs',
        template: 'pages/toplevel/jobs',
        lang: 'toplevel.jobs',
        aliases: [
            '/about-big/jobs',
            '/about-big/jobs/how-to-apply',
            '/about-big/jobs/current-vacancies',
            '/scotland/about-big/jobs/current-vacancies',
            '/wales/about-big/jobs/current-vacancies',
            '/northernireland/about-big/jobs/current-vacancies'
        ]
    }),
    benefits: staticRoute({
        path: '/jobs/benefits',
        template: 'pages/toplevel/benefits',
        lang: 'toplevel.benefits',
        aliases: ['/about-big/jobs/benefits']
    }),
    under10k: staticRoute({
        path: '/under10k',
        template: 'pages/toplevel/under10k',
        lang: 'toplevel.under10k',
        aliases: ['/funding/Awards-For-All', '/funding/awards-for-all', '/awardsforall', '/a4a', '/A4A']
    }),
    over10k: staticRoute({
        path: '/over10k',
        template: 'pages/toplevel/over10k',
        lang: 'toplevel.over10k'
    }),
    eyp: staticRoute({
        path: '/empowering-young-people',
        template: 'pages/toplevel/eyp',
        lang: 'toplevel.eyp',
        aliases: ['/global-content/programmes/northern-ireland/empowering-young-people']
    }),
    helpingWorkingFamilies: staticRoute({
        path: '/helping-working-families',
        template: 'pages/toplevel/working-families',
        lang: 'toplevel.helpingWorkingFamilies',
        aliases: ['/global-content/programmes/wales/helping-working-families']
    })
};

/**
 * Funding Routes
 */
sections.funding.pages = {
    root: dynamicRoute({
        path: '/',
        template: 'pages/toplevel/funding',
        lang: 'toplevel.funding',
        aliases: ['/home/funding']
    }),
    applyingForFunding: staticRoute({
        path: '/funding-guidance/applying-for-funding/*'
    }),
    manageFunding: staticRoute({
        path: '/funding-guidance/managing-your-funding',
        template: 'pages/funding/guidance/managing-your-funding',
        lang: 'funding.guidance.managing-your-funding',
        aliases: ['/funding/funding-guidance/managing-your-funding/help-with-publicity', '/welcome', '/publicity']
    }),
    freeMaterials: wildcardRoute({
        path: '/funding-guidance/managing-your-funding/ordering-free-materials',
        template: 'pages/funding/guidance/order-free-materials',
        lang: 'funding.guidance.order-free-materials',
        isPostable: true,
        aliases: [
            '/funding/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales',
            '/wales/funding/funding-guidance/managing-your-funding/ordering-free-materials',
            '/scotland/funding/funding-guidance/managing-your-funding/ordering-free-materials',
            '/england/funding/funding-guidance/managing-your-funding/ordering-free-materials',
            '/northernireland/funding/funding-guidance/managing-your-funding/ordering-free-materials'
        ]
    }),
    helpWithPublicity: staticRoute({
        path: '/funding-guidance/managing-your-funding/social-media',
        template: 'pages/funding/guidance/help-with-publicity',
        lang: 'funding.guidance.help-with-publicity'
    }),
    pressCoverage: staticRoute({
        path: '/funding-guidance/managing-your-funding/press',
        template: 'pages/funding/guidance/getting-press-coverage',
        lang: 'funding.guidance.getting-press-coverage',
        static: true,
        live: true
    }),
    logos: staticRoute({
        path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
        template: 'pages/funding/guidance/logos',
        lang: 'funding.guidance.logos',
        aliases: [
            '/funding/funding-guidance/managing-your-funding/logodownloads',
            '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads'
        ]
    }),
    programmes: dynamicRoute({
        path: '/programmes',
        template: 'pages/funding/programmes',
        lang: 'funding.programmes',
        allowQueryStrings: true
    }),
    programmeDetail: dynamicRoute({
        path: '/programmes/*'
    }),
    programmeDetailAfaEngland: dynamicRoute({
        path: '/programmes/national-lottery-awards-for-all-england'
    }),
    buildingBetterOpportunites: cmsRoute({
        path: '/programmes/building-better-opportunities/guide-to-delivering-european-funding',
        aliases: [
            '/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding'
        ]
    }),
    informationChecks: cmsRoute({
        path: '/funding-guidance/information-checks',
        aliases: ['/informationchecks', '/funding/funding-guidance/applying-for-funding/information-checks']
    }),
    electronicForms: cmsRoute({
        path: '/funding-guidance/help-using-our-application-forms',
        aliases: ['/funding/funding-guidance/applying-for-funding/help-using-our-electronic-application-forms']
    })
};

/**
 * Research Routes
 */
sections.research.pages = {
    root: staticRoute({
        path: '/',
        template: 'pages/toplevel/research',
        lang: 'toplevel.research',
        live: false
    })
};

/**
 * About Routes
 */
sections['about-big'].pages = {
    root: staticRoute({
        path: '/',
        template: 'pages/toplevel/about',
        lang: 'toplevel.about',
        live: false,
        aliases: [
            // 'about-big'
        ]
    }),
    freedomOfInformation: staticRoute({
        path: '/customer-service/freedom-of-information',
        template: 'pages/about/freedom-of-information',
        lang: 'about.foi',
        aliases: [
            // '/about-big/customer-service/freedom-of-information',
            '/freedom-of-information'
        ]
    }),
    dataProtection: staticRoute({
        path: '/customer-service/data-protection',
        template: 'pages/about/data-protection',
        lang: 'about.dataProtection',
        aliases: [
            // '/about-big/customer-service/data-protection,
            '/data-protection'
        ]
    }),
    // @TODO this might need fixing once we switch to /about
    tenFacts: staticRoute({
        path: '/10-big-lottery-fund-facts'
    }),
    ebulletin: dynamicRoute({
        path: '/ebulletin',
        template: 'pages/about/ebulletin',
        isPostable: true,
        aliases: ['/about-big/ebulletin-subscription', '/ebulletin']
    })
};

/**
 * Legacy proxied routes
 * The following URLs are legacy pages that are being proxied to make small amends to them.
 * They have not yet been redesigned or replaced so aren't ready to go into the main routes.
 */
const legacyProxiedRoutes = {
    fundingFinder: legacyRoute({
        path: '/funding/funding-finder'
    }),
    fundingFinderWelsh: legacyRoute({
        path: '/welsh/funding/funding-finder'
    })
};

/**
 * Other Routes
 * These are other paths that should be routed to this app via Cloudfront
 * but aren't explicit page routes (eg. static files, custom pages etc)
 */
const otherUrls = [
    basicRoute({
        path: '/robots.txt'
    }),
    basicRoute({
        path: '/assets/*'
    }),
    basicRoute({
        path: '/error'
    }),
    basicRoute({
        path: '/styleguide'
    }),
    basicRoute({
        path: '/tools/*',
        isPostable: true,
        allowQueryStrings: true
    }),
    basicRoute({
        path: '/contrast/*',
        allowQueryStrings: true
    }),
    basicRoute({
        path: '/surveys',
        allowQueryStrings: true,
        live: true
    }),
    basicRoute({
        path: '/survey/*',
        isPostable: true
    }),
    basicRoute({
        path: '/user/*',
        isPostable: true,
        allowQueryStrings: true
    }),
    basicRoute({
        path: '*~/link.aspx',
        allowQueryStrings: true,
        live: true
    })
];

module.exports = {
    sections: sections,
    legacyProxiedRoutes,
    legacyRedirects,
    vanityRedirects,
    otherUrls
};
