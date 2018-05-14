'use strict';

const path = require('path');
const { archivedRoutes, legacyRedirects, vanityRedirects } = require('./aliases');
const {
    basicRoute,
    cmsRoute,
    createSection,
    dynamicRoute,
    legacyRoute,
    sessionRoute,
    staticRoute
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
        langTitlePath: 'global.nav.research'
    }),
    about: createSection({
        path: '/about',
        langTitlePath: 'global.nav.about',
        controllerPath: path.resolve(__dirname, './about')
    }),
    blog: createSection({
        path: '/blog',
        langTitlePath: 'global.nav.blog',
        controllerPath: path.resolve(__dirname, './blog'),
        showInNavigation: false
    }),
    apply: createSection({
        path: '/apply',
        controllerPath: path.resolve(__dirname, './apply'),
        showInNavigation: false
    })
};

/**
 * Top-level Routes
 */
sections.toplevel.addRoutes({
    home: dynamicRoute({
        path: '/',
        template: 'pages/toplevel/home',
        lang: 'toplevel.home',
        isPostable: true,
        aliases: ['/home', '/index.html', '/en-gb', '/england', '/scotland', '/uk-wide']
    }),
    northernIreland: staticRoute({
        path: '/northern-ireland',
        sMaxAge: '30m',
        template: 'pages/toplevel/region',
        lang: 'toplevel.northernIreland',
        isBilingual: false,
        aliases: ['/northernireland'],
        heroSlug: 'down-right-brilliant'
    }),
    wales: staticRoute({
        path: '/wales',
        sMaxAge: '30m',
        template: 'pages/toplevel/region',
        lang: 'toplevel.wales',
        heroSlug: 'grassroots-wales'
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
    jobs: cmsRoute({
        path: '/jobs',
        aliases: [
            '/about-big/jobs',
            '/about-big/jobs/how-to-apply',
            '/about-big/jobs/current-vacancies',
            '/scotland/about-big/jobs/current-vacancies',
            '/wales/about-big/jobs/current-vacancies',
            '/england/about-big/jobs/current-vacancies',
            '/northernireland/about-big/jobs/current-vacancies',
            '/england/about-big/jobs',
            '/scotland/about-big/jobs',
            '/wales/about-big/jobs',
            '/northernireland/about-big/jobs'
        ]
    }),
    benefits: cmsRoute({
        path: '/jobs/benefits',
        aliases: ['/about-big/jobs/benefits']
    }),
    search: dynamicRoute({
        path: '/search',
        allowAllQueryStrings: true,
        live: true
    })
});

/**
 * Funding Routes
 */
sections.funding.addRoutes({
    root: dynamicRoute({
        path: '/',
        sMaxAge: '30m',
        template: 'pages/toplevel/funding',
        lang: 'toplevel.funding',
        aliases: ['/home/funding'],
        heroSlug: 'active-plus-communities'
    }),
    under10k: dynamicRoute({
        path: '/under10k',
        template: 'pages/funding/under10k',
        lang: 'funding.under10k',
        aliases: ['/funding/Awards-For-All', '/funding/awards-for-all', '/awardsforall', '/a4a', '/A4A']
    }),
    over10k: dynamicRoute({
        path: '/over10k',
        template: 'pages/funding/over10k',
        lang: 'funding.over10k'
    }),
    pastGrants: staticRoute({
        path: '/past-grants',
        template: 'pages/funding/past-grants',
        lang: 'funding.pastGrants',
        heroSlug: 'active-plus-communities'
    }),
    programmes: dynamicRoute({
        path: '/programmes',
        template: 'pages/funding/programmes',
        lang: 'funding.programmes',
        queryStrings: ['location', 'amount', 'min', 'max']
    }),
    programmeDetail: dynamicRoute({
        path: '/programmes/*'
    }),
    programmeDetailAfaScotland: dynamicRoute({
        path: '/programmes/national-lottery-awards-for-all-scotland',
        applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=sc',
        abTest: {
            cookie: 'blf-ab-afa-v2',
            percentage: 50,
            experimentId: 'EcAwbF34R5mbCaWW-y_rFQ'
        }
    }),
    buildingBetterOpportunities: cmsRoute({
        path: '/programmes/building-better-opportunities/guide-to-delivering-european-funding',
        aliases: [
            '/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding'
        ]
    }),
    buildingBetterOpportunitiesResources: cmsRoute({
        path: '/programmes/building-better-opportunities/building-better-opportunities-resources',
        aliases: [
            '/global-content/programmes/england/building-better-opportunities/building-better-opportunities-resources'
        ]
    }),
    fundingGuidanceLogos: cmsRoute({
        path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
        template: 'pages/funding/logos',
        lang: 'funding.guidance.logos'
    }),
    fundingGuidanceMaterials: sessionRoute({
        path: '/funding-guidance/managing-your-funding/ordering-free-materials',
        template: 'pages/funding/order-free-materials',
        lang: 'funding.guidance.order-free-materials',
        isPostable: true
    }),
    fundingGuidanceMaterialsActions: sessionRoute({
        path: '/funding-guidance/managing-your-funding/ordering-free-materials/*',
        isPostable: true
    }),
    fundingGuidance: cmsRoute({
        path: '/funding-guidance/*'
    })
});

/**
 * Research Routes
 */
sections.research.addRoutes({
    root: staticRoute({
        path: '/',
        sMaxAge: '30m',
        template: 'pages/toplevel/research',
        lang: 'toplevel.research',
        heroSlug: 'grassroots-project'
    })
});

/**
 * About Routes
 */
sections.about.addRoutes({
    root: staticRoute({
        path: '/',
        sMaxAge: '30m',
        template: 'pages/toplevel/about',
        lang: 'about.landing',
        heroSlug: 'mental-health-foundation',
        aliases: [
            '/about-big',
            '/england/about-big',
            '/wales/about-big',
            '/scotland/about-big',
            '/northernireland/about-big'
        ]
    }),
    seniorManagement: dynamicRoute({
        path: '/our-people/senior-management-team',
        sMaxAge: '30m',
        template: 'pages/about/senior-management-team',
        live: false
    }),
    board: dynamicRoute({
        path: '/our-people/board',
        sMaxAge: '30m',
        template: 'pages/about/board',
        live: false
    }),
    freedomOfInformation: cmsRoute({
        path: '/customer-service/freedom-of-information',
        aliases: ['/about-big/customer-service/freedom-of-information', '/freedom-of-information']
    }),
    dataProtection: cmsRoute({
        path: '/customer-service/data-protection',
        aliases: ['/about-big/customer-service/data-protection', '/data-protection']
    }),
    privacyPolicy: cmsRoute({
        path: '/customer-service/privacy-policy',
        aliases: ['/about-big/customer-service/privacy-policy']
    }),
    termsOfUse: cmsRoute({
        path: '/customer-service/terms-of-use',
        aliases: ['/about-big/customer-service/terms-of-use']
    }),
    cookies: cmsRoute({
        path: '/customer-service/cookies',
        aliases: ['/about-big/customer-service/cookies']
    }),
    customerFeedback: cmsRoute({
        path: '/customer-service/customer-feedback',
        aliases: ['/about-big/customer-service/customer-feedback']
    }),
    bogusLotteryEmails: cmsRoute({
        path: '/customer-service/bogus-lottery-emails',
        aliases: ['/about-big/customer-service/bogus-lottery-emails']
    }),
    welshLanguageScheme: cmsRoute({
        path: '/customer-service/welsh-language-scheme',
        aliases: ['/about-big/customer-service/welsh-language-scheme']
    }),
    ebulletin: dynamicRoute({
        path: '/ebulletin',
        template: 'pages/about/ebulletin',
        isPostable: true,
        aliases: ['/about-big/ebulletin-subscription', '/about-big/ebulletin', '/ebulletin']
    }),
    content: cmsRoute({
        path: '/*'
    })
});

/**
 * Blog routes
 */
sections.blog.addRoutes({
    root: dynamicRoute({
        path: '/'
    }),
    articles: dynamicRoute({
        path: '/*'
    })
});

/**
 * Apply routes
 */
sections.apply.addRoutes({
    root: dynamicRoute({
        path: '/'
    }),
    yourIdea: sessionRoute({
        path: '/your-idea/*',
        isPostable: true
    })
});

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
    sessionRoute({
        path: '/tools/*',
        isPostable: true
    }),
    basicRoute({
        path: '/contrast/*',
        queryStrings: ['url']
    }),
    basicRoute({
        path: '/surveys',
        queryStrings: ['path'],
        live: true
    }),
    basicRoute({
        path: '/survey/*',
        isPostable: true
    }),
    sessionRoute({
        path: '/user/*',
        isPostable: true,
        queryStrings: ['token']
    }),
    legacyRoute({
        path: '*~/link.aspx',
        live: true
    })
];

module.exports = {
    sections,
    archivedRoutes,
    legacyRedirects,
    legacyProxiedRoutes,
    vanityRedirects,
    otherUrls
};
