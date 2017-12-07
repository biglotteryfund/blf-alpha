/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;
const httpMocks = require('node-mocks-http');
const redirects = require('./redirects');

describe('redirects', () => {
    describe('redirectNonWww', () => {
        it('should redirect on non www production domain ', () => {
            const req = httpMocks.createRequest({
                headers: {
                    Host: 'biglotteryfund.org.uk'
                }
            });
            const res = httpMocks.createResponse();
            redirects.redirectNonWww(req, res, () => {});
            expect(res.statusCode).to.equal(301);
        });

        it('should not redirect on www production domain ', () => {
            const req = httpMocks.createRequest({
                headers: {
                    Host: 'www.biglotteryfund.org.uk'
                }
            });
            const res = httpMocks.createResponse();
            redirects.redirectNonWww(req, res, () => {});
            expect(res.statusCode).to.equal(200);
        });
    });
});
