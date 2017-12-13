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
    funding: loadController('./funding/index'),
    toplevel: loadController('./toplevel/index'),
    about: loadController('./about/index')
};

// configure base paths for site sections
const sectionPaths = {
    toplevel: '',
    funding: '/funding',
    about: '/about-big', // @TODO rename on launch
    aboutLegacy: '/about-big', // used on the old site
    research: '/research'
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
                    code: 0,
                    static: false,
                    live: true,
                    isPostable: true,
                    aliases: ['/home']
                },
                contact: {
                    name: 'Contact',
                    path: '/contact',
                    template: 'pages/toplevel/contact',
                    lang: 'toplevel.contact',
                    code: 4,
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
                    code: 7,
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
                    code: 29,
                    static: true,
                    live: true
                },
                over10k: {
                    name: 'Over 10k',
                    path: '/over10k',
                    template: 'pages/toplevel/over10k',
                    lang: 'toplevel.over10k',
                    code: 30,
                    static: true,
                    live: true
                },
                eyp: {
                    name: 'Empowering Young People',
                    path: '/empowering-young-people',
                    template: 'pages/toplevel/eyp',
                    lang: 'toplevel.eyp',
                    code: 0,
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
                },
                reachingCommunities: {
                    name: 'Reaching Communities',
                    path: '/experimental/reaching-communities',
                    template: 'pages/experimental/reaching-communities',
                    lang: 'toplevel.reachingCommunities',
                    static: true,
                    live: false
                }
            }
        },
        funding: {
            name: 'Funding',
            langTitlePath: 'global.nav.funding',
            path: sectionPaths.funding,
            controller: controllers.funding,
            pages: {
                logos: {
                    name: 'Logos',
                    path: '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads',
                    template: 'pages/funding/guidance/logos',
                    lang: 'funding.guidance.logos',
                    code: 1,
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.funding +
                            '/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos',
                        sectionPaths.funding + '/funding-guidance/managing-your-funding/logodownloads'
                    ]
                },
                manageFunding: {
                    name: 'Managing your funding',
                    path: '/funding-guidance/managing-your-funding',
                    template: 'pages/funding/guidance/managing-your-funding',
                    lang: 'funding.guidance.managing-your-funding',
                    code: 2,
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
                    code: 3,
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
                    code: 12,
                    static: true,
                    live: true
                },
                pressCoverage: {
                    name: 'Getting press coverage',
                    path: '/funding-guidance/managing-your-funding/press',
                    template: 'pages/funding/guidance/getting-press-coverage',
                    lang: 'funding.guidance.getting-press-coverage',
                    code: 18,
                    static: true,
                    live: true
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
                    template: 'pages/funding/programme-detail',
                    allowQueryStrings: false,
                    static: false,
                    live: false
                }
            }
        },
        research: {
            name: 'Research',
            langTitlePath: 'global.nav.research',
            path: sectionPaths.research
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
                    code: 0,
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
                    code: 85,
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
                    code: 84,
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
    programmeMigration('england/reaching-communities-england', 'reaching-communities-england', false),
    programmeMigration('england/parks-for-people', 'parks-for-people', false),
    programmeMigration('northern-ireland/people-and-communities', 'people-and-communities', false),
    programmeMigration('wales/people-and-places-medium-grants', 'people-and-places-medium-grants', false),
    programmeMigration('wales/people-and-places-large-grants', 'people-and-places-large-grants', false),
    programmeMigration('scotland/community-assets', 'community-assets', false),
    programmeMigration('uk-wide/east-africa-disability-fund', 'east-africa-disability-fund', false),
    programmeMigration('scotland/grants-for-community-led-activity', 'grants-for-community-led-activity', false),
    programmeMigration('scotland/grants-for-improving-lives', 'grants-for-improving-lives', false),
    programmeMigration('scotland/our-place', 'our-place', false),
    programmeMigration('scotland/scottish-land-fund', 'scottish-land-fund', false),
    programmeMigration('uk-wide/forces-in-mind', 'forces-in-mind', false),
    programmeMigration('uk-wide/uk-portfolio', 'uk-portfolio', false),
    programmeMigration('uk-wide/lottery-funding', 'other-lottery-funders', false)
];

/**
 * Vanity URLs
 *
 * Set up some vanity URL redirects that can't be defined in the aliases on the routes above
 */
const vanityDestinations = {
    publicity: routes.sections.funding.path + routes.sections.funding.pages.manageFunding.path,
    contact: routes.sections.toplevel.path + routes.sections.toplevel.pages.contact.path
};
const vanityRedirects = [
    {
        // this has to be here and not as an alias
        // otherwise it won't be recognised as a welsh URL
        name: 'Publicity (Welsh)',
        path: '/cyhoeddusrwydd',
        destination: '/welsh' + vanityDestinations.publicity,
        aliasOnly: true,
        live: true
    },
    {
        name: 'Helping Working Families',
        path: '/helpingworkingfamilies',
        destination: routes.sections.toplevel.pages.helpingWorkingFamilies.path,
        aliasOnly: true,
        live: true
    },
    {
        name: 'Helping Working Families (Welsh)',
        path: '/helputeuluoeddgweithio',
        destination: '/welsh' + routes.sections.toplevel.pages.helpingWorkingFamilies.path,
        aliasOnly: true,
        live: true
    },
    {
        // this stays here (and not as an alias) as express doesn't care about URL case
        // and this link is the same (besides case) as an existing alias
        // (annoyingly, the Title Case version of this link persists on the web... for now.)
        name: 'Logo page',
        path: '/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads',
        destination: routes.sections.funding.path + routes.sections.funding.pages.logos.path,
        aliasOnly: true,
        live: true
    },
    // the following aliases use custom destinations (eg. with URL anchors)
    // so can't live in the regular aliases section (as they all have the same destination)
    {
        name: 'Contact press team',
        path: '/news-and-events/contact-press-team',
        destination: vanityDestinations.contact + '#' + anchors.contactPress,
        live: true
    },
    {
        name: 'Contact press team (Welsh)',
        path: '/welsh/news-and-events/contact-press-team',
        destination: '/welsh' + vanityDestinations.contact + '#' + anchors.contactPress,
        live: true
    },
    {
        name: 'Complaint page',
        path: '/about-big/customer-service/making-a-complaint',
        destination: vanityDestinations.contact + '#' + anchors.contactComplaints,
        live: true
    },
    {
        name: 'Complaint page (England)',
        path: '/england/about-big/customer-service/making-a-complaint',
        destination: vanityDestinations.contact + '#' + anchors.contactComplaints,
        live: true
    },
    {
        name: 'Complaint page (Welsh)',
        path: '/welsh/about-big/customer-service/making-a-complaint',
        destination: '/welsh' + vanityDestinations.contact + '#' + anchors.contactComplaints,
        live: true
    },
    {
        name: 'Fraud page',
        path: '/about-big/customer-service/fraud',
        destination: vanityDestinations.contact + '#' + anchors.contactFraud,
        live: true
    },
    {
        name: 'Fraud page (Welsh)',
        path: '/welsh/about-big/customer-service/fraud',
        destination: '/welsh' + vanityDestinations.contact + '#' + anchors.contactFraud,
        live: true
    },
    {
        name: 'Awards For All England',
        path: '/prog_a4a_eng',
        destination: '/global-content/programmes/england/awards-for-all-england',
        live: true
    },
    {
        name: 'Awards For All Scotland',
        path: '/awardsforallscotland',
        destination: '/global-content/programmes/scotland/awards-for-all-scotland',
        live: false // Mark as live when launching AFA test in Scotland
    },
    {
        name: 'Reaching Communities England',
        path: '/prog_reaching_communities',
        destination: '/funding/programmes/reaching-communities-england',
        live: false // Migration experiment
    },
    {
        name: 'Parks for People',
        path: '/prog_parks_people',
        destination: '/funding/programmes/parks-for-people',
        live: false // Migration experiment
    }
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
    awardsForAllEngland: withLegacyDefaults({
        path: '/global-content/programmes/england/awards-for-all-england',
        live: true
    }),
    awardsForAllScotland: withLegacyDefaults({
        path: '/global-content/programmes/scotland/awards-for-all-scotland',
        live: false
    }),
    awardsForAllWales: withLegacyDefaults({
        path: '/global-content/programmes/wales/awards-for-all-wales',
        live: false
    }),
    awardsForAllWalesWelsh: withLegacyDefaults({
        path: '/welsh/global-content/programmes/wales/awards-for-all-wales',
        live: false
    })
};

/**
 * Other Routes
 * These are other paths that should be routed to this app via Cloudfront
 * but aren't explicit page routes (eg. static files, custom pages etc)
 */
const otherUrls = [
    {
        path: '/funding/funding-finder',
        isPostable: false,
        allowQueryStrings: true,
        live: false
    },
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
    }
];

module.exports = {
    sections: routes.sections,
    programmeRedirects: programmeRedirects,
    vanityRedirects: vanityRedirects,
    legacyProxiedRoutes: legacyProxiedRoutes,
    otherUrls: otherUrls
};
