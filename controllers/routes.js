'use strict';

const { basicContent, flexibleContent } = require('./common');

module.exports = {
    toplevel: {
        path: '',
        pages: [
            { path: '/', router: require('./home') },
            { path: '/data', router: require('./data') },
            { path: '/jobs*', router: basicContent() },
        ],
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
    user: {
        path: '/user',
        router: require('./user'),
    },
    apply: {
        path: '/apply',
        router: require('./apply'),
    },
};
