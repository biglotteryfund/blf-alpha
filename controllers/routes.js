'use strict';

const { basicContent, flexibleContent } = require('./common');

module.exports = {
    home: {
        path: '/',
        router: require('./home'),
    },
    funding: {
        path: '/funding',
        router: require('./funding'),
    },
    insights: {
        path: '/insights',
        router: require('./insights'),
    },
    contact: {
        path: '/contact',
        router: basicContent(),
    },
    about: {
        path: '/about',
        pages: [
            { path: '/', router: flexibleContent() },
            { path: '/our-people', router: require('./our-people') },
            { path: '/*', router: basicContent() },
        ],
    },
    updates: {
        path: '/news',
        router: require('./updates'),
    },
    // @TODO: Move to about router?
    jobs: {
        path: '/jobs*',
        router: basicContent(),
    },
    // @TODO: Move to about router?
    data: {
        path: '/data',
        router: require('./data'),
    },
    user: {
        path: '/user',
        router: require('./user'),
    },
    apply: {
        path: '/apply',
        router: require('./apply'),
    },
};
