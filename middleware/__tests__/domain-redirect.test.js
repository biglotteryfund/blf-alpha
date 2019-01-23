/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const domainRedirect = require('../domain-redirect');

describe('domain redirect', () => {
    it('should redirect old domain to new domain', () => {
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/some/example/url/',
            headers: {
                Host: 'www.biglotteryfund.org.uk',
                'X-Forwarded-Proto': 'https'
            }
        });

        const res = httpMocks.createResponse();

        domainRedirect(req, res, () => {});
        expect(res.statusCode).toBe(301);
    });

    it('should not redirect new domain', () => {
        const req = httpMocks.createRequest({
            method: 'GET',
            url: '/some/example/url/',
            headers: {
                Host: 'www.tnlcommunityfund.org.uk',
                'X-Forwarded-Proto': 'https'
            }
        });

        const res = httpMocks.createResponse();

        domainRedirect(req, res, () => {});
        expect(res.statusCode).toBe(200);
    });
});
