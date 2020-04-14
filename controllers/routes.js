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
    talk: {
        path: '/contact',
        pages: [{ path: '/', router: basicContent() }],
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
        pages: [{ path: '/', router: require('./updates') }],
    },
    user: {
        path: '/user',
        router: require('./user'),
    },
    apply: {
        path: '/apply',
        pages: [{ path: '/', router: require('./apply') }],
    },
};
