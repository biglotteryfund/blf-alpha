/* eslint-env jest */
'use strict';
const config = require('config');

const routes = require('../../controllers/routes');
const cloudfrontDistributions = config.get('aws.cloudfrontDistributions');

const { generateUrlList, makeBehaviourItem, generateBehaviours } = require('../cloudfront');

const testRoutes = {
    sections: {
        purple: {
            path: '/purple',
            pages: {
                monkey: {
                    path: '/monkey/dishwasher',
                    live: true,
                    isPostable: true,
                    allowAllQueryStrings: true,
                    aliases: ['/green/orangutan/fridge']
                }
            }
        }
    },
    cloudfrontRules: [
        {
            path: '/unicorns',
            isPostable: true,
            queryStrings: ['foo', 'bar'],
            live: true
        },
        {
            path: '/draft',
            live: false
        }
    ]
};

describe('#generateUrlList', () => {
    it('should filter out non-custom routes', done => {
        const urls = generateUrlList(testRoutes);
        expect(urls.length).toBe(4);
        done();
    });

    it('should generate the correct section/page path', done => {
        const urls = generateUrlList(testRoutes);
        expect(urls.filter(r => r.path === '/unicorns').length).toBe(1);
        done();
    });

    it('should generate welsh versions of canonical routes', done => {
        const urls = generateUrlList(testRoutes);
        expect(urls.filter(r => r.path === '/welsh/purple/monkey/dishwasher').length).toBe(1);
        done();
    });

    it('should store properties against routes', done => {
        const urls = generateUrlList(testRoutes);
        expect(urls.filter(r => r.path === '/unicorns')[0].isPostable).toBe(true);
        done();
    });
});

describe('#makeBehaviourItem', () => {
    it('should return cloudfront behaviour for route', () => {
        const behaviour = makeBehaviourItem({
            originId: 'BLF_EXAMPLE',
            pathPattern: '/',
            isPostable: true,
            queryStringWhitelist: ['q'],
            cookiesInUse: ['example']
        });

        expect(behaviour).toMatchSnapshot();
    });

    it('should allow all cookies and querystrings', () => {
        const behaviour = makeBehaviourItem({
            originId: 'BLF_LEGACY_EXAMPLE',
            pathPattern: '/~/*',
            isPostable: true,
            allowAllQueryStrings: true,
            allowAllCookies: true,
            protocol: 'allow-all',
            headersToKeep: ['*']
        });

        expect(behaviour).toMatchSnapshot();
    });
});

describe('generateBehaviours', () => {
    const behaviours = generateBehaviours({
        routesConfig: routes,
        origins: cloudfrontDistributions.live.origins
    });

    expect(behaviours).toMatchSnapshot();
});
