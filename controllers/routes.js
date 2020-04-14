'use strict';

const { basicContent, flexibleContent } = require('./common');

module.exports = {
    toplevel: {
        path: '',
        pages: [
            { path: '/', router: require('./home') },
            { path: '/data', router: require('./data') },
            { path: '/jobs*', router: basicContent() },
            { path: '/search', router: require('./search') },
            { path: '/user', router: require('./user') },
        ],
    },
    funding: {
        path: '/funding',
        router: require('./funding'),
    },
    insights: {
        path: '/insights',
        pages: [{ path: '/', router: require('./insights') }],
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
    apply: {
        path: '/apply',
        pages: [{ path: '/', router: require('./apply') }],
    },
};
