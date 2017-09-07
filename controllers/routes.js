"use strict";
const config = require('config');

const handlers = {
    funding: (c) => require('./funding/index')(c),
    toplevel: (c) => require('./toplevel/index')(c),
    about: (c) => require('./about/index')(c)
};

const routes = {
    sections: {
        global: {
            name: "Global (top-level pages)",
            path: "",
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
                        "/about-big/contact-us",
                        "/help-and-support",
                        "/england/about-big/contact-us",
                        "/wales/about-big/contact-us",
                        "/scotland/about-big/contact-us",
                        "/northernireland/about-big/contact-us"
                    ]
                },
                about: {
                    name: "About",
                    path: "/about",
                    template: "pages/toplevel/about",
                    lang: "toplevel.about",
                    code: 0,
                    static: true,
                    live: false,
                    aliases: [
                        "/about-big",
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
                        '/about-big/jobs',
                        '/about-big/jobs/how-to-apply',
                        '/about-big/jobs/current-vacancies'
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
                        '/about-big/jobs/benefits',
                    ]
                },
                under10k: {
                    name: "Under 10k",
                    path: "/under10k",
                    template: "pages/toplevel/under10k",
                    lang: "toplevel.under10k",
                    code: 29,
                    static: true,
                    live: false,
                    aliases: []
                },
                over10k: {
                    name: "Over 10k",
                    path: "/over10k",
                    template: "pages/toplevel/over10k",
                    lang: "toplevel.over10k",
                    code: 30,
                    static: true,
                    live: false,
                    aliases: []
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
                        '/global-content/programmes/northern-ireland/empowering-young-people'
                    ]
                },
            }
        },
        about: {
            name: "About",
            path: "/about-big",
            handler: handlers.about,
            pages: {
                freedomOfInformation: {
                    name: "Freedom of Information",
                    path: "/customer-service/freedom-of-information",
                    template: "pages/about/freedom-of-information",
                    lang: "about.foi",
                    code: 85,
                    static: true,
                    live: true
                },
                dataProtection: {
                    name: "Data Protection",
                    path: "/customer-service/data-protection",
                    template: "pages/about/data-protection",
                    lang: "about.dataProtection",
                    code: 84,
                    static: true,
                    live: true
                }
            }
        },
        funding: {
            name: "Funding",
            path: "/funding",
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
                        "/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos",
                        "/funding-guidance/managing-your-funding/logodownloads"
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
                        '/funding-guidance/managing-your-funding/help-with-publicity'
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
                        '/funding-guidance/managing-your-funding/ordering-free-materials/bilingual-materials-for-use-in-wales'
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
        }
    }
};

const anchors = config.get('anchors');

const vanityDestinations = {
    publicity: routes.sections.funding.path + routes.sections.funding.pages.manageFunding.path,
    contact: routes.sections.global.path + routes.sections.global.pages.contact.path,
    managingFunding: routes.sections.funding.path + routes.sections.funding.pages.manageFunding.path,
    freeMaterials: routes.sections.funding.path + routes.sections.funding.pages.freeMaterials.path
};

const vanityRedirects = [
    {
        name: "Publicity",
        path: "/publicity",
        destination: vanityDestinations.publicity,
        aliasOnly: true
    },
    {
        name: "Publicity (Welsh)",
        path: "/cyhoeddusrwydd",
        destination: '/welsh' + vanityDestinations.publicity,
        aliasOnly: true
    },
    {
        name: "Managing Your Funding",
        path: "/welcome",
        destination: vanityDestinations.managingFunding,
        aliasOnly: true
    },
    {
        name: "Logo page",
        path: "/funding/funding-guidance/managing-your-funding/grant-acknowledgement-and-logos/LogoDownloads",
        destination: routes.sections.funding.path + routes.sections.funding.pages.logos.path,
        aliasOnly: true
    },
    {
        name: "Data Protection",
        path: "/data-protection",
        destination: routes.sections.about.path + routes.sections.about.pages.dataProtection.path,
        aliasOnly: true
    },
    {
        name: "FOI",
        path: "/freedom-of-information",
        destination: routes.sections.about.path + routes.sections.about.pages.freedomOfInformation.path,
        aliasOnly: true
    },
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
    },
    {
        name: "Free materials",
        destination: vanityDestinations.freeMaterials,
        paths: [
            '/wales/funding/funding-guidance/managing-your-funding/ordering-free-materials',
            '/scotland/funding/funding-guidance/managing-your-funding/ordering-free-materials',
            '/england/funding/funding-guidance/managing-your-funding/ordering-free-materials',
            '/northernireland/funding/funding-guidance/managing-your-funding/ordering-free-materials',
        ]
    },
    {
        name: "Free materials (Welsh)",
        destination: '/welsh' + vanityDestinations.freeMaterials,
        paths: [
            '/welsh/wales/funding/funding-guidance/managing-your-funding/ordering-free-materials',
            '/welsh/scotland/funding/funding-guidance/managing-your-funding/ordering-free-materials',
            '/welsh/england/funding/funding-guidance/managing-your-funding/ordering-free-materials',
            '/welsh/northernireland/funding/funding-guidance/managing-your-funding/ordering-free-materials'
        ]
    }
];

module.exports = {
    sections: routes.sections,
    vanityRedirects: vanityRedirects
};