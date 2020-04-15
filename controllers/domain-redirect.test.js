/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const domainRedirect = require('./domain-redirect');

function createRequestFor(host) {
    return httpMocks.createRequest({
        method: 'GET',
        url: '/some/example/url/',
        headers: { 'Host': host, 'X-Forwarded-Proto': 'https' },
    });
}

test('should redirect old domain to new domain', () => {
    const req = createRequestFor('apply.tnlcommunityfund.org.uk');
    const res = httpMocks.createResponse();
    domainRedirect(req, res, () => {});
    expect(res.statusCode).toBe(301);
});

test('should not redirect new domain', () => {
    const req = createRequestFor('www.tnlcommunityfund.org.uk');
    const res = httpMocks.createResponse();
    domainRedirect(req, res, () => {});
    expect(res.statusCode).toBe(200);
});
