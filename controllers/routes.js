'use strict';

const path = require('path');
const aliases = require('./aliases');
const { cmsRoute, createSection, customRoute, legacyRoute, sessionRoute, staticRoute } = require('./route-types');

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
    home: customRoute({
        path: '/',
        template: 'pages/toplevel/home',
        lang: 'toplevel.home',
        isPostable: true
    }),
    northernIreland: staticRoute({
        path: '/northern-ireland',
        sMaxAge: '30m',
        template: 'pages/toplevel/region',
        lang: 'toplevel.northernIreland',
        isBilingual: false,
        heroSlug: 'down-right-brilliant'
    }),
    wales: staticRoute({
        path: '/wales',
        sMaxAge: '30m',
        template: 'pages/toplevel/region',
        lang: 'toplevel.wales',
        heroSlug: 'grassroots-wales'
    }),
    contact: cmsRoute({
        path: '/contact'
    }),
    data: customRoute({
        path: '/data',
        template: 'pages/toplevel/data',
        lang: 'toplevel.data'
    }),
    jobs: cmsRoute({
        path: '/jobs/*'
    }),
    search: customRoute({
        path: '/search',
        allowAllQueryStrings: true,
        live: true
    })
});

/**
 * Funding Routes
 */
sections.funding.addRoutes({
    root: customRoute({
        path: '/',
        sMaxAge: '30m',
        template: 'pages/toplevel/funding',
        lang: 'toplevel.funding',
        heroSlug: 'active-plus-communities'
    }),
    under10k: customRoute({
        path: '/under10k',
        template: 'pages/funding/under10k',
        lang: 'funding.under10k',
        heroSlug: 'friends-of-greenwich'
    }),
    over10k: customRoute({
        path: '/over10k',
        template: 'pages/funding/over10k',
        lang: 'funding.over10k',
        heroSlug: 'passion-4-fusion-3'
    }),
    pastGrants: staticRoute({
        path: '/past-grants',
        template: 'pages/funding/past-grants',
        lang: 'funding.pastGrants',
        heroSlug: 'active-plus-communities'
    }),
    programmes: customRoute({
        path: '/programmes',
        template: 'pages/funding/programmes',
        lang: 'funding.programmes',
        queryStrings: ['location', 'amount', 'min', 'max']
    }),
    programmeDetail: customRoute({
        path: '/programmes/*'
    }),
    programmeDetailAfaScotland: customRoute({
        path: '/programmes/national-lottery-awards-for-all-scotland',
        applyUrl: 'https://apply.biglotteryfund.org.uk/?cn=sc',
        abTest: {
            cookie: 'blf-ab-afa-v2',
            percentage: 50,
            experimentId: 'EcAwbF34R5mbCaWW-y_rFQ'
        }
    }),
    buildingBetterOpportunities: cmsRoute({
        path: '/programmes/building-better-opportunities/guide-to-delivering-european-funding'
    }),
    buildingBetterOpportunitiesResources: cmsRoute({
        path: '/programmes/building-better-opportunities/building-better-opportunities-resources'
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
        template: 'pages/toplevel/about',
        lang: 'about.landing',
        heroSlug: 'mental-health-foundation',
        sMaxAge: '30m'
    }),
    seniorManagement: customRoute({
        path: '/our-people/senior-management-team',
        template: 'pages/about/senior-management-team',
        lang: 'about.ourPeople.seniorManagement',
        heroSlug: 'mental-health-foundation',
        live: false
    }),
    board: customRoute({
        path: '/our-people/board',
        template: 'pages/about/board',
        lang: 'about.ourPeople.board',
        live: false
    }),
    freedomOfInformation: cmsRoute({
        path: '/customer-service/freedom-of-information'
    }),
    dataProtection: cmsRoute({
        path: '/customer-service/data-protection'
    }),
    privacyPolicy: cmsRoute({
        path: '/customer-service/privacy-policy'
    }),
    termsOfUse: cmsRoute({
        path: '/customer-service/terms-of-use'
    }),
    cookies: cmsRoute({
        path: '/customer-service/cookies'
    }),
    customerFeedback: cmsRoute({
        path: '/customer-service/customer-feedback'
    }),
    bogusLotteryEmails: cmsRoute({
        path: '/customer-service/bogus-lottery-emails'
    }),
    welshLanguageScheme: cmsRoute({
        path: '/customer-service/welsh-language-scheme'
    }),
    ebulletin: customRoute({
        path: '/ebulletin',
        template: 'pages/about/ebulletin',
        isPostable: true
    }),
    content: cmsRoute({
        path: '/*'
    })
});

/**
 * Blog routes
 */
sections.blog.addRoutes({
    root: customRoute({
        path: '/'
    }),
    articles: customRoute({
        path: '/*'
    })
});

/**
 * Apply routes
 */
sections.apply.addRoutes({
    root: customRoute({
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
    customRoute({ path: '/robots.txt' }),
    customRoute({ path: '/assets/*' }),
    customRoute({ path: '/error' }),
    customRoute({ path: '/styleguide' }),
    sessionRoute({ path: '/tools/*', isPostable: true }),
    customRoute({ path: '/contrast/*', queryStrings: ['url'] }),
    customRoute({ path: '/surveys', queryStrings: ['path'] }),
    customRoute({ path: '/survey/*', isPostable: true }),
    sessionRoute({ path: '/user/*', isPostable: true, queryStrings: ['token'] }),
    legacyRoute({ path: '*~/link.aspx' })
];

/**
 * Archived Routes
 * Paths in this array will be redirected to the National Archives
 */
const archivedRoutes = [
    customRoute({ path: '/funding/funding-guidance/applying-for-funding/*' }),
    customRoute({ path: '/about-big/10-big-lottery-fund-facts' })
];

module.exports = {
    archivedRoutes,
    legacyProxiedRoutes,
    otherUrls,
    aliases,
    sections
};
