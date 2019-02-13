/* eslint-env jest */
'use strict';
const config = require('config');
const cloudfrontDistributions = config.get('aws.cloudfrontDistributions');
const { makeBehaviourItem, generateBehaviours } = require('../cloudfront');

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

    it('should allow all querystrings', () => {
        const behaviour = makeBehaviourItem({
            originId: 'BLF_EXAMPLE',
            pathPattern: '/example',
            isPostable: true,
            allowAllQueryStrings: true,
            cookiesInUse: ['example'],
            headersToKeep: ['*']
        });

        expect(behaviour).toMatchSnapshot();
    });
});

describe('generateBehaviours', () => {
    const behaviours = generateBehaviours(cloudfrontDistributions.live.origins);
    expect(behaviours).toMatchSnapshot();
});
