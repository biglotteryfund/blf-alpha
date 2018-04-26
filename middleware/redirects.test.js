/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;
const httpMocks = require('node-mocks-http');
const { cleanLinkNoise, cleanSpaces, redirectNonWww } = require('./redirects');

describe('redirects', () => {
    describe('cleanLinkNoise', () => {
        it('should clean link noise from the URL', () => {
            expect(cleanLinkNoise('/funding/programmes/reaching-communities-england')).to.equal(
                '/funding/programmes/reaching-communities-england'
            );

            expect(cleanLinkNoise('/~/link.aspx')).to.equal('/');

            expect(
                cleanLinkNoise('/research/health-and-well-being/~/~/~/~/~/~/~/~/~/~/~/~/~/~/~/~/link.aspx')
            ).to.equal('/research/health-and-well-being/');

            expect(cleanLinkNoise('/welsh/england/funding/funding-guidance/applying-for-funding/~/link.aspx')).to.equal(
                '/welsh/england/funding/funding-guidance/applying-for-funding/'
            );
        });
    });

    describe('cleanSpaces', () => {
        it('should clean spaces from the URL', () => {
            expect(
                cleanSpaces(
                    '/global-%20content/programmes/england/commissioning-better-%20outcomes-%20and-social-%20outcomes-fund'
                )
            ).to.equal('/global-content/programmes/england/commissioning-better-outcomes-and-social-outcomes-fund');

            expect(
                cleanSpaces(
                    '/global- content/programmes/england/commissioning-better- outcomes- and-social- outcomes-fund'
                )
            ).to.equal('/global-content/programmes/england/commissioning-better-outcomes-and-social-outcomes-fund');

            expect(cleanSpaces('/funding/programmes/reaching-communities-england')).to.equal(
                '/funding/programmes/reaching-communities-england'
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
            expect(res.statusCode).to.equal(301);
        });

        it('should not redirect on www production domain ', () => {
            const req = httpMocks.createRequest({
                headers: {
                    Host: 'www.biglotteryfund.org.uk'
                }
            });
            const res = httpMocks.createResponse();
            redirectNonWww(req, res, () => {});
            expect(res.statusCode).to.equal(200);
        });
    });
});
