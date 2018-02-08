'use strict';
const path = require('path');
const config = require('config');
const {
    createSection,
    basicRoute,
    staticRoute,
    dynamicRoute,
    wildcardRoute,
    cmsRoute,
    legacyRoute,
    vanity,
    programmeMigration
} = require('./route-types');

const anchors = config.get('anchors');

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
        aliases: ['/about-big/jobs', '/about-big/jobs/how-to-apply', '/about-big/jobs/current-vacancies']
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
    ebulletin: dynamicRoute({
        path: '/ebulletin',
        template: 'pages/about/ebulletin',
        isPostable: true,
        aliases: [
            '/about-big/ebulletin-subscription',
            '/ebulletin'
        ]
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
 * Legacy Redirects
 */
const legacyRedirects = [
    // Migrated Programme Pages [LIVE]
    programmeMigration('england/awards-for-all-england', 'national-lottery-awards-for-all-england'),
    programmeMigration('england/reaching-communities-england', 'reaching-communities-england'),
    programmeMigration('northern-ireland/awards-for-all-northern-ireland', 'awards-for-all-northern-ireland'),
    programmeMigration('scotland/awards-for-all-scotland', 'national-lottery-awards-for-all-scotland'),
    programmeMigration('scotland/grants-for-community-led-activity', 'grants-for-community-led-activity'),
    programmeMigration('scotland/grants-for-improving-lives', 'grants-for-improving-lives'),
    programmeMigration('wales/people-and-places-medium-grants', 'people-and-places-medium-grants'),
    programmeMigration('wales/people-and-places-large-grants', 'people-and-places-large-grants'),
    programmeMigration('uk-wide/uk-portfolio', 'awards-from-the-uk-portfolio'),
    programmeMigration('uk-wide/coastal-communities', 'coastal-communities-fund'),
    programmeMigration('uk-wide/lottery-funding', 'other-lottery-funders'),
    programmeMigration('northern-ireland/people-and-communities', 'people-and-communities'),
    programmeMigration('wales/awards-for-all-wales', 'national-lottery-awards-for-all-wales'),
    programmeMigration('england/building-better-opportunities', 'building-better-opportunities'),

    // Migrated Programme Pages [DRAFT]
    programmeMigration('england/parks-for-people', 'parks-for-people', false),
    programmeMigration('scotland/community-assets', 'community-assets', false),
    programmeMigration('uk-wide/east-africa-disability-fund', 'east-africa-disability-fund', false),
    programmeMigration('scotland/our-place', 'our-place', false),
    programmeMigration('scotland/scottish-land-fund', 'scottish-land-fund', false),
    programmeMigration('uk-wide/forces-in-mind', 'forces-in-mind', false)
];

/**
 * Vanity URLs
 */
const vanityRedirects = [
    vanity('/Home/Funding/Funding*Finder', '/funding/programmes'),
    vanity('/welsh/Home/Funding/Funding*Finder', '/funding/programmes'),
    vanity('/funding/scotland-portfolio', '/funding/programmes?location=scotland'),
    vanity('/a4aengland', '/funding/programmes/national-lottery-awards-for-all-england'),
    vanity('/prog_a4a_eng', '/funding/programmes/national-lottery-awards-for-all-england'),
    vanity('/awardsforallscotland', '/funding/programmes/national-lottery-awards-for-all-scotland'),
    vanity('/prog_a4a_ni', '/funding/programmes/awards-for-all-northern-ireland'),
    vanity('/a4awales', '/funding/programmes/national-lottery-awards-for-all-wales'),
    vanity('/prog_a4a_wales', '/funding/programmes/national-lottery-awards-for-all-wales'),
    vanity('/prog_reaching_communities', '/funding/programmes/reaching-communities-england'),
    vanity('/helpingworkingfamilies', '/helping-working-families'),
    vanity('/helputeuluoeddgweithio', '/welsh/helping-working-families'),
    vanity('/improvinglives', '/funding/programmes/grants-for-improving-lives'),
    vanity('/communityled', '/funding/programmes/grants-for-community-led-activity'),
    vanity('/peopleandcommunities', '/funding/programmes/people-and-communities'),
    vanity('/cyhoeddusrwydd', '/welsh/funding/funding-guidance/managing-your-funding'),
    vanity('/ccf', '/funding/programmes/coastal-communities-fund'),
    vanity('/esf', '/funding/programmes/building-better-opportunities'),
    vanity(
        '/guidancetrackingprogress',
        '/funding/funding-guidance/applying-for-funding/tracking-project-progress/guidance-on-tracking-progress'
    ),
    // This stays here (and not as an alias) as express doesn't care about URL case
    // and this link is the same (besides case) as an existing alias
    // (annoyingly, the Title Case version of this link persists on the web... for now.)
    vanity(
        '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads',
        '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos'
    ),
    // The following aliases use custom destinations (eg. with URL anchors)
    // so can't live in the regular aliases section (as they all have the same destination)
    vanity('/news-and-events/contact-press-team', `/contact#${anchors.contactPress}`),
    vanity('/welsh/news-and-events/contact-press-team', `/welsh/contact#${anchors.contactPress}`),
    vanity('/about-big/customer-service/making-a-complaint', `/contact#${anchors.contactComplaints}`),
    vanity('/england/about-big/customer-service/making-a-complaint', `/contact#${anchors.contactComplaints}`),
    vanity('/welsh/about-big/customer-service/making-a-complaint', `/welsh/contact#${anchors.contactComplaints}`),
    vanity('/about-big/customer-service/fraud', `/contact#${anchors.contactFraud}`),
    vanity('/welsh/about-big/customer-service/fraud', `/welsh/contact#${anchors.contactFraud}`)
];

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
