'use strict';

const path = require('path');
const aliases = require('./aliases');
const {
    createSection,
    customRoute,
    sessionRoute,
    staticContentRoute,
    basicContentRoute,
    flexibleContentRoute,
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
    local: createSection({
        path: '/local',
        langTitlePath: 'global.nav.local',
        showInNavigation: false
    }),
    research: createSection({
        path: '/research',
        langTitlePath: 'global.nav.research',
        controllerPath: path.resolve(__dirname, './research')
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
    northernIreland: staticContentRoute({
        path: '/northern-ireland',
        sMaxAge: '30m',
        template: 'pages/toplevel/region',
        lang: 'toplevel.northernIreland',
        isBilingual: false,
        heroSlug: 'down-right-brilliant'
    }),
    wales: staticContentRoute({
        path: '/wales',
        sMaxAge: '30m',
        template: 'pages/toplevel/region',
        lang: 'toplevel.wales',
        heroSlug: 'grassroots-wales'
    }),
    contact: basicContentRoute({
        path: '/contact'
    }),
    data: customRoute({
        path: '/data',
        template: 'pages/toplevel/data',
        lang: 'toplevel.data',
        heroSlug: 'young-shoulders-programme'
    }),
    jobs: basicContentRoute({
        path: '/jobs'
    }),
    jobsBenefits: basicContentRoute({
        path: '/jobs/benefits'
    }),
    search: customRoute({
        path: '/search',
        allowAllQueryStrings: true
    })
});

/**
 * Local Routes
 */
sections.local.addRoutes({
    root: staticContentRoute({
        path: '/',
        template: 'pages/toplevel/local',
        isBilingual: false,
        lang: 'toplevel.local',
        heroSlug: 'arkwright-meadows',
        live: false
    })
});

/**
 * Funding Routes
 */
sections.funding.addRoutes({
    root: customRoute({
        path: '/',
        sMaxAge: '30m',
        template: 'pages/funding/index',
        lang: 'toplevel.funding',
        heroSlug: 'active-plus-communities'
    }),
    rootTest: staticContentRoute({
        path: '/test',
        template: 'pages/funding/index-test',
        lang: 'toplevel.funding',
        heroSlug: 'ragroof-players',
        live: false
    }),
    thinkingOfApplying: staticContentRoute({
        path: '/thinking-of-applying',
        template: 'pages/funding/thinking-of-applying',
        lang: 'funding.thinkingOfApplying',
        heroSlug: 'building-bridges',
        live: false
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
    pastGrants: staticContentRoute({
        path: '/past-grants',
        template: 'pages/funding/past-grants',
        lang: 'funding.pastGrants',
        heroSlug: 'active-plus-communities'
    }),
    pastGrantsAlpha: customRoute({
        path: '/search-past-grants-alpha',
        live: false,
        template: 'pages/grants/search',
        isPostable: true,
        allowAllQueryStrings: true
    }),
    programmes: customRoute({
        path: '/programmes',
        template: 'pages/funding/programmes',
        lang: 'funding.programmes',
        heroSlug: 'the-young-foundation',
        queryStrings: ['location', 'amount', 'min', 'max']
    }),
    programmeDetail: customRoute({
        path: '/programmes/*',
        template: 'pages/funding/programme-detail'
    }),
    buildingBetterOpportunities: basicContentRoute({
        path: '/programmes/building-better-opportunities/guide-to-delivering-european-funding'
    }),
    buildingBetterOpportunitiesResources: basicContentRoute({
        path: '/programmes/building-better-opportunities/building-better-opportunities-resources'
    }),
    fundingGuidanceLogos: basicContentRoute({
        path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
        template: 'pages/funding/logos',
        lang: 'funding.guidance.logos'
    }),
    fundingGuidanceMaterials: sessionRoute({
        path: '/funding-guidance/managing-your-funding/ordering-free-materials',
        lang: 'funding.guidance.order-free-materials',
        isPostable: true
    }),
    fundingGuidanceMaterialsActions: sessionRoute({
        path: '/funding-guidance/managing-your-funding/ordering-free-materials/*',
        isPostable: true
    }),
    fundingGuidance: basicContentRoute({
        path: '/funding-guidance/*'
    }),
    fundingFinderLegacy: legacyRoute({
        path: '/funding-finder'
    })
});

/**
 * Research Routes
 */
sections.research.addRoutes({
    root: customRoute({
        path: '/',
        lang: 'toplevel.research',
        heroSlug: 'grassroots-project'
    }),
    rootNew: customRoute({
        path: '/landing-new',
        lang: 'toplevel.research',
        heroSlug: 'grassroots-project',
        live: false
    })
});

/**
 * About Routes
 */
sections.about.addRoutes({
    root: flexibleContentRoute({
        path: '/'
    }),
    seniorManagement: customRoute({
        path: '/our-people/senior-management-team',
        template: 'pages/about/senior-management-team',
        lang: 'about.ourPeople.seniorManagement',
        heroSlug: 'mental-health-foundation'
    }),
    board: customRoute({
        path: '/our-people/board',
        template: 'pages/about/board',
        lang: 'about.ourPeople.board',
        live: false
    }),
    ebulletin: customRoute({
        path: '/ebulletin',
        template: 'pages/about/ebulletin',
        lang: 'toplevel.ebulletin',
        heroSlug: 'street-dreams',
        isPostable: true
    }),
    content: basicContentRoute({
        path: '/*'
    })
});

/**
 * Blog routes
 */
sections.blog.addRoutes({
    root: customRoute({
        path: '/',
        live: false
    }),
    articles: customRoute({
        path: '/*',
        live: false
    })
});

/**
 * Apply routes
 */
sections.apply.addRoutes({
    root: customRoute({
        path: '/'
    }),
    applicationForms: sessionRoute({
        path: '/*',
        isPostable: true
    })
});


/**
 * Other Routes
 * These are other paths that should be routed to this app via Cloudfront
 * but aren't explicit page routes (eg. static files, custom pages etc)
 */
const otherUrls = [
    customRoute({ path: '/assets/*' }),
    customRoute({ path: '/error' }),
    sessionRoute({ path: '/tools/*', isPostable: true }),
    customRoute({ path: '/contrast/*', queryStrings: ['url'] }),
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
    aliases,
    archivedRoutes,
    otherUrls,
    sections
};
