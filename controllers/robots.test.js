/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const robotsHandler = require('./robots');

test('should allow indexing on live domain', () => {
    const req = httpMocks.createRequest({
        method: 'GET',
        url: '/robots.txt',
        headers: {
            'Host': 'www.tnlcommunityfund.org.uk',
            'X-Forwarded-Proto': 'https'
        }
    });

    const res = httpMocks.createResponse();

    robotsHandler(req, res);

    expect(res._getData()).toMatchSnapshot();
});

test('should block indexing on other domains', () => {
    const req = httpMocks.createRequest({
        method: 'GET',
        url: '/robots.txt',
        headers: {
            'Host': 'apply.tnlcommunityfund.org.uk',
            'X-Forwarded-Proto': 'https'
        }
    });

    const res = httpMocks.createResponse();

    robotsHandler(req, res);

    expect(res._getData()).toMatchSnapshot();
});
