/* eslint-env mocha */
'use strict';
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
});
