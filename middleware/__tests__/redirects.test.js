/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const { redirectNonWww } = require('../redirects');

describe('redirects', () => {
    describe('redirectNonWww', () => {
        it('should redirect on non www production domain ', () => {
            const req = httpMocks.createRequest({
                headers: {
                    Host: 'biglotteryfund.org.uk'
                }
            });
            const res = httpMocks.createResponse();
            redirectNonWww(req, res, () => {});
            expect(res.statusCode).toBe(301);
        });

        it('should not redirect on www production domain ', () => {
            const req = httpMocks.createRequest({
                headers: {
                    Host: 'www.biglotteryfund.org.uk'
                }
            });
            const res = httpMocks.createResponse();
            redirectNonWww(req, res, () => {});
            expect(res.statusCode).toBe(200);
        });
    });
});
