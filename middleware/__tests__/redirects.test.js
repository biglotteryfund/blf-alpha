/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const { cleanLinkNoise, redirectNonWww } = require('../redirects');

describe('redirects', () => {
    describe('cleanLinkNoise', () => {
        it('should clean link noise from the URL', () => {
            expect(cleanLinkNoise('/funding/programmes/reaching-communities-england')).toBe(
                '/funding/programmes/reaching-communities-england'
            );

            expect(cleanLinkNoise('/~/link.aspx')).toBe('/');

            expect(cleanLinkNoise('/research/health-and-well-being/~/~/~/~/~/~/~/~/~/~/~/~/~/~/~/~/link.aspx')).toBe(
                '/research/health-and-well-being/'
            );

            expect(cleanLinkNoise('/welsh/england/funding/funding-guidance/applying-for-funding/~/link.aspx')).toBe(
                '/welsh/england/funding/funding-guidance/applying-for-funding/'
            );
        });
    });

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
