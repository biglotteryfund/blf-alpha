"use strict";
const config = require('config');

const handlers = {
    funding: (pages, sectionPath, sectionId) => require('./funding/index')(pages, sectionPath, sectionId),
    toplevel: (pages, sectionPath, sectionId) => require('./toplevel/index')(pages, sectionPath, sectionId),
    about: (pages, sectionPath, sectionId) => require('./about/index')(pages, sectionPath, sectionId)
};

const sectionPaths = {
    global: "",
    funding: "/funding",
    about: "/about",
    aboutLegacy: "/about-big" // used on the old site
};

// these top-level sections appear in the main site nav
// (in the order presented here)
const routes = {
    sections: {
        global: {
            name: "Global (top-level pages)",
            langTitlePath: "global.nav.home",
            path: sectionPaths.global,
            handler: handlers.toplevel,
            pages: {
                home: {
                    name: "Home",
                    path: "/",
                    template: "pages/toplevel/home",
                    lang: "toplevel.home",
                    code: 0,
                    static: false,
                    live: false
                },
                ebulletin: {
                    name: "e-bulletin",
                    path: "/ebulletin",
                    static: false,
                    live: false,
                    isPostable: true
                },
                contact: {
                    name: "Contact",
                    path: "/contact",
                    template: "pages/toplevel/contact",
                    lang: "toplevel.contact",
                    code: 4,
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.global + "/about-big/contact-us",
                        sectionPaths.global + "/help-and-support",
                        sectionPaths.global + "/england/about-big/contact-us",
                        sectionPaths.global + "/wales/about-big/contact-us",
                        sectionPaths.global + "/scotland/about-big/contact-us",
                        sectionPaths.global + "/northernireland/about-big/contact-us"
                    ]
                },
                data: {
                    name: "Data",
                    path: "/data",
                    template: "pages/toplevel/data",
                    lang: "toplevel.data",
                    static: false,
                    live: true
                },
                jobs: {
                    name: "Jobs",
                    path: "/jobs",
                    template: "pages/toplevel/jobs",
                    lang: "toplevel.jobs",
                    code: 7,
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.global + '/about-big/jobs',
                        sectionPaths.global + '/about-big/jobs/how-to-apply',
                        sectionPaths.global + '/about-big/jobs/current-vacancies'
                    ]
                },
                benefits: {
                    name: "Benefits",
                    path: "/jobs/benefits",
                    template: "pages/toplevel/benefits",
                    lang: "toplevel.benefits",
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.global + '/about-big/jobs/benefits',
                    ]
                },
                under10k: {
                    name: "Under 10k",
                    path: "/under10k",
                    template: "pages/toplevel/under10k",
                    lang: "toplevel.under10k",
                    code: 29,
                    static: true,
                    live: false
                },
                over10k: {
                    name: "Over 10k",
                    path: "/over10k",
                    template: "pages/toplevel/over10k",
                    lang: "toplevel.over10k",
                    code: 30,
                    static: true,
                    live: false
                },
                eyp: {
                    name: "Empowering Young People",
                    path: "/empowering-young-people",
                    template: "pages/toplevel/eyp",
                    lang: "toplevel.eyp",
                    code: 0,
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.global + '/global-content/programmes/northern-ireland/empowering-young-people'
                    ]
                }
            }
        },
        funding: {
            name: "Funding",
            langTitlePath: "global.nav.funding",
            path: sectionPaths.funding,
            handler: handlers.funding,
            pages: {
                logos: {
                    name: "Logos",
                    path: "/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/logodownloads",
                    template: "pages/funding/guidance/logos",
                    lang: "funding.guidance.logos",
                    code: 1,
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.funding + "/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos",
                        sectionPaths.funding + "/funding-guidance/managing-your-funding/logodownloads"
                    ]
                },
                manageFunding: {
                    name: "Managing your funding",
                    path: "/funding-guidance/managing-your-funding",
                    template: "pages/funding/guidance/managing-your-funding",
                    lang: "funding.guidance.managing-your-funding",
                    code: 2,
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.funding + '/funding-guidance/managing-your-funding/help-with-publicity',
                        "/welcome",
                        "/publicity"
                    ]
                },
                freeMaterials: {
                    name: "Ordering free materials",
                    path: "/funding-guidance/managing-your-funding/ordering-free-materials",
                    template: "pages/funding/guidance/order-free-materials",
                    lang: "funding.guidance.order-free-materials",
                    code: 3,
                    live: true,
                    isPostable: true,
                    isWildcard: true,
                    aliases: [
                        sectionPaths.funding + '/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales',
                        '/wales/funding/funding-guidance/managing-your-funding/ordering-free-materials',
                        '/scotland/funding/funding-guidance/managing-your-funding/ordering-free-materials',
                        '/england/funding/funding-guidance/managing-your-funding/ordering-free-materials',
                        '/northernireland/funding/funding-guidance/managing-your-funding/ordering-free-materials'
                    ]
                },
                helpWithPublicity: {
                    name: "Help with publicity",
                    path: "/funding-guidance/managing-your-funding/social-media",
                    template: "pages/funding/guidance/help-with-publicity",
                    lang: "funding.guidance.help-with-publicity",
                    code: 12,
                    static: true,
                    live: true
                },
                pressCoverage: {
                    name: "Getting press coverage",
                    path: "/funding-guidance/managing-your-funding/press",
                    template: "pages/funding/guidance/getting-press-coverage",
                    lang: "funding.guidance.getting-press-coverage",
                    code: 18,
                    static: true,
                    live: true
                }
            }
        },
        about: {
            name: "About",
            langTitlePath: "global.nav.about",
            path: sectionPaths.about,
            handler: handlers.about,
            pages: {
                root: {
                    name: "About",
                    path: "/",
                    template: "pages/toplevel/about",
                    lang: "toplevel.about",
                    code: 0,
                    static: true,
                    live: false,
                    aliases: [
                        sectionPaths.aboutLegacy
                    ]
                },
                freedomOfInformation: {
                    name: "Freedom of Information",
                    path: "/customer-service/freedom-of-information",
                    template: "pages/about/freedom-of-information",
                    lang: "about.foi",
                    code: 85,
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.aboutLegacy + "/customer-service/freedom-of-information",
                        "/freedom-of-information"
                    ]
                },
                dataProtection: {
                    name: "Data Protection",
                    path: "/customer-service/data-protection",
                    template: "pages/about/data-protection",
                    lang: "about.dataProtection",
                    code: 84,
                    static: true,
                    live: true,
                    aliases: [
                        sectionPaths.aboutLegacy + "/customer-service/data-protection",
                        "/data-protection"
                    ]
                }
            }
        }

    }
};

const anchors = config.get('anchors');

const vanityDestinations = {
    publicity: routes.sections.funding.path + routes.sections.funding.pages.manageFunding.path,
    contact: routes.sections.global.path + routes.sections.global.pages.contact.path
};

const vanityRedirects = [
    {
        // this has to be here and not as an alias
        // otherwise it won't be recognised as a welsh URL
        name: "Publicity (Welsh)",
        path: "/cyhoeddusrwydd",
        destination: '/welsh' + vanityDestinations.publicity,
        aliasOnly: true
    },
    {
        // this stays here (and not as an alias) as express doesn't care about URL case
        // and this link is the same (besides case) as an existing alias
        // (annoyingly, the Title Case version of this link persists on the web... for now.)
        name: "Logo page",
        path: "/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads",
        destination: routes.sections.funding.path + routes.sections.funding.pages.logos.path,
        aliasOnly: true
    },
    // the following aliases use custom destinations (eg. with URL anchors)
    // so can't live in the regular aliases section
    {
        name: "Contact press team",
        path: "/news-and-events/contact-press-team",
        destination: vanityDestinations.contact + '#' + anchors.contactPress
    },
    {
        name: "Contact press team (Welsh)",
        path: "/welsh/news-and-events/contact-press-team",
        destination: '/welsh' + vanityDestinations.contact + '#' + anchors.contactPress
    },
    {
        name: "Complaint page",
        path: '/about-big/customer-service/making-a-complaint',
        destination: vanityDestinations.contact + '#' + anchors.contactComplaints
    },
    {
        name: "Complaint page (England)",
        path: '/england/about-big/customer-service/making-a-complaint',
        destination: vanityDestinations.contact + '#' + anchors.contactComplaints
    },
    {
        name: "Complaint page (Welsh)",
        path: '/welsh/about-big/customer-service/making-a-complaint',
        destination: '/welsh' + vanityDestinations.contact + '#' + anchors.contactComplaints
    },
    {
        name: "Fraud page",
        path: '/about-big/customer-service/fraud',
        destination: vanityDestinations.contact + '#' + anchors.contactFraud
    },
    {
        name: "Fraud page (Welsh)",
        path: '/welsh/about-big/customer-service/fraud',
        destination: '/welsh' + vanityDestinations.contact + '#' + anchors.contactFraud
    }
];

module.exports = {
    sections: routes.sections,
    vanityRedirects: vanityRedirects
};