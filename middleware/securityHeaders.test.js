/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;
const httpMocks = require('node-mocks-http');
const securityHeaders = require('./securityHeaders');

describe('securityHeaders', () => {
    it('should add Content-Security-Policy header', () => {
        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        securityHeaders()(req, res, () => {});
        expect(res.get('Content-Security-Policy')).to.contain("default-src 'self'");
        expect(res.get('Content-Security-Policy')).to.exist;
    });

    it('should not add Content-Security-Policy header for exempt URLs', () => {
        const req = httpMocks.createRequest({
            path: '/global-content/programmes/wales/awards-for-all-wales'
        });
        const res = httpMocks.createResponse();

        securityHeaders()(req, res, () => {});
        expect(res.get('Content-Security-Policy')).to.not.exist;
    });
});
