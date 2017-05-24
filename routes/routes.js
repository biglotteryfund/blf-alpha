"use strict";

const handlers = {
    funding: (c) => require('../routes/funding')(c)
};

const routes = {
    sections: {
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
                }
            }
        }
    }
};

const vanityRedirects = [
    {
        name: "Publicity",
        path: "/publicity",
        destination: routes.sections.funding.path + routes.sections.funding.pages.manageFunding.path
    },
    {
        name: "Publicity (Welsh)",
        path: "/cyhoeddusrwydd",
        destination: '/welsh' + routes.sections.funding.path + routes.sections.funding.pages.manageFunding.path
    }
];

module.exports = {
    sections: routes.sections,
    vanityRedirects: vanityRedirects
};