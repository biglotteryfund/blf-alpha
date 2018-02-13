/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;
const httpMocks = require('node-mocks-http');
const { defaultSecurityHeaders } = require('./securityHeaders');

describe('securityHeaders', () => {
    it('should add Content-Security-Policy header', () => {
        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        defaultSecurityHeaders()(req, res, () => {});
        expect(res.get('Content-Security-Policy')).to.contain("default-src 'self'");
        expect(res.get('Content-Security-Policy')).to.exist;
    });

    it('should not add Content-Security-Policy header for exempt URLs', () => {
        const req = httpMocks.createRequest({
            path: '/funding/funding-finder'
        });
        const res = httpMocks.createResponse();

        defaultSecurityHeaders()(req, res, () => {});
        expect(res.get('Content-Security-Policy')).to.not.exist;
    });
});
