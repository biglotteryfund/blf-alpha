/* eslint-env jest */
'use strict';

const { _buildCountMetricData } = require('../metrics');

describe('_buildCountMetricData', () => {
    it('should build count metric data', () => {
        expect(
            _buildCountMetricData({
                name: '123456',
                namespace: 'SITE/NEWSLETTER',
                dimension: 'SUBSCRIBED',
                value: 'SUBSCRIBED_COUNT'
            })
        ).toMatchSnapshot();

        expect(
            _buildCountMetricData({
                name: 'example_email',
                namespace: 'SITE/MAIL',
                dimension: 'MAIL_SENT',
                value: 'SEND_COUNT'
            })
        ).toMatchSnapshot();
    });
});
