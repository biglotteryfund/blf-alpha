'use strict';
const config = require('config');
const anchors = config.get('anchors');

// pass some parameters onto each controller
// so we can take route config and init all at once
const loadController = path => {
    return (pages, sectionPath, sectionId) => require(path)(pages, sectionPath, sectionId);
};

// define top-level controllers for the site
const controllers = {
    toplevel: loadController('./toplevel'),
    funding: loadController('./funding'),
    research: loadController('./research'),
    about: loadController('./about')
};

// configure base paths for site sections
const sectionPaths = {
    toplevel: '',
    funding: '/funding',
    research: '/research',
    about: '/about-big', // @TODO rename on launch
    aboutLegacy: '/about-big' // used on the old site
};

// these top-level sections appear in the main site nav
// (in the order presented here)
const routes = {
    sections: {
        toplevel: {
            name: 'Top-level pages',
            langTitlePath: 'global.nav.home',
            path: sectionPaths.toplevel,
            controller: controllers.toplevel,
            pages: {
                home: {
                    name: 'Home',
                    path: '/',
                    template: 'pages/toplevel/home',
                    lang: 'toplevel.home',
                    static: false,
                    live: true,
                    isPostable: true,
                    aliases: [
                        '/home',
                        '/index.html',
                        '/en-gb',
                        '/england',
                        '/uk-wide',
                        '/funding/funding-guidance/applying-for-funding'
                    ]
                },
                contact: {
                    name: 'Contact',
                    path: '/contact',
                    template: 'pages/toplevel/contact',
                    lang: 'toplevel.contact',
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.toplevel + '/about-big/contact-us',
                        sectionPaths.toplevel + '/help-and-support',
                        sectionPaths.toplevel + '/england/about-big/contact-us',
                        sectionPaths.toplevel + '/wales/about-big/contact-us',
                        sectionPaths.toplevel + '/scotland/about-big/contact-us',
                        sectionPaths.toplevel + '/northernireland/about-big/contact-us'
                    ]
                },
                data: {
                    name: 'Data',
                    path: '/data',
                    template: 'pages/toplevel/data',
                    lang: 'toplevel.data',
                    static: false,
                    live: true
                },
                jobs: {
                    name: 'Jobs',
                    path: '/jobs',
                    template: 'pages/toplevel/jobs',
                    lang: 'toplevel.jobs',
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.toplevel + '/about-big/jobs',
                        sectionPaths.toplevel + '/about-big/jobs/how-to-apply',
                        sectionPaths.toplevel + '/about-big/jobs/current-vacancies'
                    ]
                },
                benefits: {
                    name: 'Benefits',
                    path: '/jobs/benefits',
                    template: 'pages/toplevel/benefits',
                    lang: 'toplevel.benefits',
                    static: true,
                    live: true,
                    aliases: [sectionPaths.toplevel + '/about-big/jobs/benefits']
                },
                under10k: {
                    name: 'Under 10k',
                    path: '/under10k',
                    template: 'pages/toplevel/under10k',
                    lang: 'toplevel.under10k',
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.funding + '/Awards-For-All',
                        sectionPaths.funding + '/awards-for-all',
                        sectionPaths.toplevel + '/awardsforall',
                        sectionPaths.toplevel + '/a4a',
                        sectionPaths.toplevel + '/A4A'
                    ]
                },
                over10k: {
                    name: 'Over 10k',
                    path: '/over10k',
                    template: 'pages/toplevel/over10k',
                    lang: 'toplevel.over10k',
                    static: true,
                    live: true
                },
                eyp: {
                    name: 'Empowering Young People',
                    path: '/empowering-young-people',
                    template: 'pages/toplevel/eyp',
                    lang: 'toplevel.eyp',
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.toplevel + '/global-content/programmes/northern-ireland/empowering-young-people'
                    ]
                },
                helpingWorkingFamilies: {
                    name: 'Helping Working Families',
                    path: '/helping-working-families',
                    template: 'pages/toplevel/working-families',
                    lang: 'toplevel.helpingWorkingFamilies',
                    static: true,
                    live: true,
                    aliases: [`${sectionPaths.toplevel}/global-content/programmes/wales/helping-working-families`]
                }
            }
        },
        funding: {
            name: 'Funding',
            langTitlePath: 'global.nav.funding',
            path: sectionPaths.funding,
            controller: controllers.funding,
            pages: {
                root: {
                    name: 'Funding',
                    path: '/',
                    template: 'pages/toplevel/funding',
                    lang: 'toplevel.funding',
                    static: false,
                    live: true,
                    aliases: ['/home/funding']
                },
                applyingForFunding: {
                    name: 'Applying for funding',
                    path: '/funding-guidance/applying-for-funding/*',
                    static: false,
                    live: true
                },
                manageFunding: {
                    name: 'Managing your funding',
                    path: '/funding-guidance/managing-your-funding',
                    template: 'pages/funding/guidance/managing-your-funding',
                    lang: 'funding.guidance.managing-your-funding',
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.funding + '/funding-guidance/managing-your-funding/help-with-publicity',
                        '/welcome',
                        '/publicity'
                    ]
                },
                freeMaterials: {
                    name: 'Ordering free materials',
                    path: '/funding-guidance/managing-your-funding/ordering-free-materials',
                    template: 'pages/funding/guidance/order-free-materials',
                    lang: 'funding.guidance.order-free-materials',
                    live: true,
                    isPostable: true,
                    isWildcard: true,
                    aliases: [
                        sectionPaths.funding +
                            '/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales',
                        '/wales/funding/funding-guidance/managing-your-funding/ordering-free-materials',
                        '/scotland/funding/funding-guidance/managing-your-funding/ordering-free-materials',
                        '/england/funding/funding-guidance/managing-your-funding/ordering-free-materials',
                        '/northernireland/funding/funding-guidance/managing-your-funding/ordering-free-materials'
                    ]
                },
                helpWithPublicity: {
                    name: 'Help with publicity',
                    path: '/funding-guidance/managing-your-funding/social-media',
                    template: 'pages/funding/guidance/help-with-publicity',
                    lang: 'funding.guidance.help-with-publicity',
                    static: true,
                    live: true
                },
                pressCoverage: {
                    name: 'Getting press coverage',
                    path: '/funding-guidance/managing-your-funding/press',
                    template: 'pages/funding/guidance/getting-press-coverage',
                    lang: 'funding.guidance.getting-press-coverage',
                    static: true,
                    live: true
                },
                logos: {
                    name: 'Logos',
                    path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads',
                    template: 'pages/funding/guidance/logos',
                    lang: 'funding.guidance.logos',
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.funding +
                            '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
                        sectionPaths.funding + '/funding-guidance/managing-your-funding/logodownloads'
                    ]
                },
                programmes: {
                    name: 'Funding programmes',
                    path: '/programmes',
                    template: 'pages/funding/programmes',
                    lang: 'funding.programmes',
                    allowQueryStrings: true,
                    static: false,
                    live: true
                },
                programmeDetail: {
                    name: 'Funding programme details',
                    path: '/programmes/*',
                    static: false,
                    live: true
                },
                programmeDetailAfaEngland: {
                    name: 'Awards For All England',
                    path: '/programmes/national-lottery-awards-for-all-england',
                    static: false,
                    live: true
                },
                buildingBetterOpportunites: {
                    name: 'Building Better Opportunites',
                    path: '/programmes/building-better-opportunities/guide-to-delivering-european-funding',
                    useCmsContent: true,
                    live: true,
                    aliases: [
                        '/global-content/programmes/england/building-better-opportunities/guide-to-delivering-european-funding'
                    ]
                },
                informationChecks: {
                    name: 'Information checks',
                    path: '/funding-guidance/information-checks',
                    useCmsContent: true,
                    live: true,
                    aliases: ['/informationchecks']
                },
                electronicForms: {
                    name: 'Help with PDFs',
                    path: '/funding-guidance/help-using-our-application-forms',
                    useCmsContent: true,
                    live: true,
                    aliases: [
                        '/funding/funding-guidance/applying-for-funding/help-using-our-electronic-application-forms'
                    ]
                }
            }
        },
        research: {
            name: 'Research',
            langTitlePath: 'global.nav.research',
            path: sectionPaths.research,
            controller: controllers.research,
            pages: {
                root: {
                    name: 'Research',
                    path: '/',
                    template: 'pages/toplevel/research',
                    lang: 'toplevel.research',
                    static: true,
                    live: false
                }
            }
        },
        // @TODO rename this to 'about' when ready to launch /about
        'about-big': {
            name: 'About',
            langTitlePath: 'global.nav.about',
            path: sectionPaths.about,
            controller: controllers.about,
            pages: {
                root: {
                    name: 'About',
                    path: '/',
                    template: 'pages/toplevel/about',
                    lang: 'toplevel.about',
                    static: true,
                    live: false,
                    aliases: [
                        // sectionPaths.aboutLegacy
                    ]
                },
                freedomOfInformation: {
                    name: 'Freedom of Information',
                    path: '/customer-service/freedom-of-information',
                    template: 'pages/about/freedom-of-information',
                    lang: 'about.foi',
                    static: true,
                    live: true,
                    aliases: [
                        // sectionPaths.aboutLegacy + "/customer-service/freedom-of-information",
                        '/freedom-of-information'
                    ]
                },
                dataProtection: {
                    name: 'Data Protection',
                    path: '/customer-service/data-protection',
                    template: 'pages/about/data-protection',
                    lang: 'about.dataProtection',
                    static: true,
                    live: true,
                    aliases: [
                        // sectionPaths.aboutLegacy + "/customer-service/data-protection",
                        '/data-protection'
                    ]
                }
            }
        }
    }
};

/**
 * Programme Migration
 *
 * Handle redirects from /global-content/programmes to /funding/programmes
 * @TODO: Consider merging into a global-content/programmes/* handler
 *        once we decide to migrate all programme pages.
 */
function programmeMigration(from, to, isLive) {
    return {
        path: `/global-content/programmes/${from}`,
        destination: `/funding/programmes/${to}`,
        isPostable: false,
        allowQueryStrings: false,
        live: !isLive ? false : true
    };
}

const programmeRedirects = [
    // Live
    programmeMigration('england/awards-for-all-england', 'national-lottery-awards-for-all-england', true),
    programmeMigration('england/reaching-communities-england', 'reaching-communities-england', true),
    programmeMigration('northern-ireland/awards-for-all-northern-ireland', 'awards-for-all-northern-ireland', true),
    programmeMigration('scotland/awards-for-all-scotland', 'national-lottery-awards-for-all-scotland', true),
    programmeMigration('scotland/grants-for-community-led-activity', 'grants-for-community-led-activity', true),
    programmeMigration('scotland/grants-for-improving-lives', 'grants-for-improving-lives', true),
    programmeMigration('wales/people-and-places-medium-grants', 'people-and-places-medium-grants', true),
    programmeMigration('wales/people-and-places-large-grants', 'people-and-places-large-grants', true),
    programmeMigration('uk-wide/uk-portfolio', 'awards-from-the-uk-portfolio', true),
    programmeMigration('uk-wide/coastal-communities', 'coastal-communities-fund', true),
    programmeMigration('uk-wide/lottery-funding', 'other-lottery-funders', true),
    programmeMigration('northern-ireland/people-and-communities', 'people-and-communities', true),
    programmeMigration('wales/awards-for-all-wales', 'national-lottery-awards-for-all-wales', true),
    programmeMigration('england/building-better-opportunities', 'building-better-opportunities', true),
    // Draft
    programmeMigration('england/parks-for-people', 'parks-for-people', false),
    programmeMigration('scotland/community-assets', 'community-assets', false),
    programmeMigration('uk-wide/east-africa-disability-fund', 'east-africa-disability-fund', false),
    programmeMigration('scotland/our-place', 'our-place', false),
    programmeMigration('scotland/scottish-land-fund', 'scottish-land-fund', false),
    programmeMigration('uk-wide/forces-in-mind', 'forces-in-mind', false)
];

/**
 * Vanity URLs
 *
 * Set up some vanity URL redirects that can't be defined in the aliases on the routes above
 */
function vanity(urlPath, destination, isLive = false) {
    return {
        path: urlPath,
        destination: destination,
        isPostable: false,
        allowQueryStrings: false,
        live: isLive
    };
}

const vanityRedirects = [
    vanity('/Home/Funding/Funding*Finder', '/funding/programmes', true),
    vanity('/welsh/Home/Funding/Funding*Finder', '/funding/programmes', true),
    vanity('/funding/scotland-portfolio', '/funding/programmes?location=scotland', true),
    vanity('/a4aengland', '/funding/programmes/national-lottery-awards-for-all-england', true),
    vanity('/prog_a4a_eng', '/funding/programmes/national-lottery-awards-for-all-england', true),
    vanity('/awardsforallscotland', '/funding/programmes/national-lottery-awards-for-all-scotland', true),
    vanity('/prog_a4a_ni', '/funding/programmes/awards-for-all-northern-ireland', true),
    vanity('/a4awales', '/funding/programmes/national-lottery-awards-for-all-wales', true),
    vanity('/prog_a4a_wales', '/funding/programmes/national-lottery-awards-for-all-wales', true),
    vanity('/prog_reaching_communities', '/funding/programmes/reaching-communities-england', true),
    vanity('/helpingworkingfamilies', '/helping-working-families', true),
    vanity('/helputeuluoeddgweithio', '/welsh/helping-working-families', true),
    vanity('/improvinglives', '/funding/programmes/grants-for-improving-lives', true),
    vanity('/communityled', '/funding/programmes/grants-for-community-led-activity', true),
    vanity('/peopleandcommunities', '/funding/programmes/people-and-communities', true),
    vanity('/cyhoeddusrwydd', '/welsh/funding/funding-guidance/managing-your-funding', true),
    vanity('/ccf', '/funding/programmes/coastal-communities-fund', true),
    vanity('/esf', '/funding/programmes/building-better-opportunities', true),
    vanity(
        '/guidancetrackingprogress',
        '/funding/funding-guidance/applying-for-funding/tracking-project-progress/guidance-on-tracking-progress',
        true
    ),

    // This stays here (and not as an alias) as express doesn't care about URL case
    // and this link is the same (besides case) as an existing alias
    // (annoyingly, the Title Case version of this link persists on the web... for now.)
    vanity(
        '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads',
        '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
        true
    ),

    // The following aliases use custom destinations (eg. with URL anchors)
    // so can't live in the regular aliases section (as they all have the same destination)
    vanity('/news-and-events/contact-press-team', `/contact#${anchors.contactPress}`, true),
    vanity('/welsh/news-and-events/contact-press-team', `/welsh/contact#${anchors.contactComplaints}`, true),
    vanity('/about-big/customer-service/making-a-complaint', `/contact#${anchors.contactPress}`, true),
    vanity('/england/about-big/customer-service/making-a-complaint', `/contact#${anchors.contactComplaints}`, true),
    vanity('/welsh/about-big/customer-service/making-a-complaint', `/welsh/contact#${anchors.contactComplaints}`, true),
    vanity('/about-big/customer-service/fraud', `/contact#${anchors.contactFraud}`, true),
    vanity('/welsh/about-big/customer-service/fraud', `/welsh/contact#${anchors.contactFraud}`, true)
];

/**
 * Legacy proxied routes
 * The following URLs are legacy pages that are being proxied to make small amends to them.
 * They have not yet been redesigned or replaced so aren't ready to go into the main routes.
 */
function withLegacyDefaults(props) {
    const defaults = {
        isPostable: true,
        allowQueryStrings: true,
        live: false
    };
    return Object.assign({}, defaults, props);
}
const legacyProxiedRoutes = {
    fundingFinder: withLegacyDefaults({
        path: '/funding/funding-finder',
        live: true
    }),
    fundingFinderWelsh: withLegacyDefaults({
        path: '/welsh/funding/funding-finder',
        live: true
    })
};

/**
 * Other Routes
 * These are other paths that should be routed to this app via Cloudfront
 * but aren't explicit page routes (eg. static files, custom pages etc)
 */
const otherUrls = [
    {
        path: '/assets/*',
        isPostable: false,
        allowQueryStrings: false,
        live: true
    },
    {
        path: '/contrast/*',
        isPostable: false,
        allowQueryStrings: true,
        live: true
    },
    {
        path: '/error',
        isPostable: false,
        allowQueryStrings: false,
        live: true
    },
    {
        path: '/tools/*',
        isPostable: true,
        allowQueryStrings: true,
        live: true
    },
    {
        path: '/styleguide',
        isPostable: false,
        allowQueryStrings: false,
        live: true
    },
    {
        path: '/robots.txt',
        isPostable: false,
        allowQueryStrings: false,
        live: true
    },
    {
        path: '/ebulletin',
        isPostable: true,
        allowQueryStrings: false,
        live: true
    },
    {
        path: '/surveys',
        isPostable: false,
        allowQueryStrings: true,
        live: true
    },
    {
        path: '/survey/*',
        isPostable: true,
        allowQueryStrings: false,
        live: true
    },
    {
        path: '/user/*',
        isPostable: true,
        allowQueryStrings: true,
        live: true
    },
    {
        path: '*~/link.aspx',
        isPostable: false,
        allowQueryStrings: true,
        live: true
    }
];

module.exports = {
    sections: routes.sections,
    programmeRedirects: programmeRedirects,
    vanityRedirects: vanityRedirects,
    legacyProxiedRoutes: legacyProxiedRoutes,
    otherUrls: otherUrls
};
