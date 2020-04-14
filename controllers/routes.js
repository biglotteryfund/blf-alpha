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
        pages: [
            {
                path: '/',
                router: require('./funding'),
            },
            {
                path: '/programmes',
                router: require('./programmes'),
            },
            {
                path: '/strategic-investments',
                router: require('./strategic-investments'),
            },
            {
                path: '/the-big-lunch',
                router: basicContent(),
            },
            {
                path: '/grants',
                router: require('./grants'),
            },
            {
                path: '/funding-guidance/*',
                router: basicContent(),
            },
            {
                path: `/managing-your-grant/promoting-your-project/order-free-materials`,
                router: require('./materials'),
            },
            {
                path: `/managing-your-grant/promoting-your-project/download-our-logo`,
                router: basicContent({ customTemplate: 'static-pages/logos' }),
            },
            {
                path: '/*',
                router: basicContent({ cmsPage: true }),
            },
        ],
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
