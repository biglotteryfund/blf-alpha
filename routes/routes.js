"use strict";
const config = require('config');

const handlers = {
    funding: (c) => require('../routes/funding')(c),
    toplevel: (c) => require('../routes/toplevel')(c)
};

const routes = {
    sections: {
        global: {
            name: "Global (top-level pages)",
            path: "",
            handler: handlers.toplevel,
            pages: {
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
                jobs: {
                    name: "Jobs",
                    path: "/jobs",
                    template: "pages/toplevel/jobs",
                    lang: "toplevel.jobs",
                    code: 7,
                    static: true,
                    live: false,
                    aliases: [
                        '/about-big/jobs',
                        '/about-big/jobs/benefits',
                        '/about-big/jobs/how-to-apply',
                        '/about-big/jobs/current-vacancies'
                    ]
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

const contactPressAnchor = config.get('contactPressAnchor');

const vanityDestinations = {
    publicity: routes.sections.funding.path + routes.sections.funding.pages.manageFunding.path,
    contact: routes.sections.global.path + routes.sections.global.pages.contact.path
};

const vanityRedirects = [
    {
        name: "Publicity",
        path: "/publicity",
        destination: vanityDestinations.publicity
    },
    {
        name: "Publicity (Welsh)",
        path: "/cyhoeddusrwydd",
        destination: '/welsh' + vanityDestinations.publicity
    },
    {
        name: "Contact press team",
        path: "/news-and-events/contact-press-team",
        destination: vanityDestinations.contact + '#' + contactPressAnchor
    },
    {
        name: "Contact press team (Welsh)",
        path: "/welsh/news-and-events/contact-press-team",
        destination: '/welsh' + vanityDestinations.contact + '#' + contactPressAnchor
    }
];

module.exports = {
    sections: routes.sections,
    vanityRedirects: vanityRedirects
};