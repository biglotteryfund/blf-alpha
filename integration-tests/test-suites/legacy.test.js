'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('../helper');

describe('Legacy pages proxying', () => {
    let server;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => {
        helper.after(server);
    });

    function requestRedirect(urlPath) {
        return chai
            .request(server)
            .get(urlPath)
            .redirects(0)
            .catch(err => err.response);
    }

    describe('Funding Finder Redirects', () => {
        function fundingFinderRequest({ originalPath, redirectedPath }) {
            return requestRedirect(originalPath).then(res => {
                return {
                    res,
                    originalPath,
                    redirectedPath
                };
            });
        }

        it('should redirect old funding finder', () => {
            return Promise.all([
                fundingFinderRequest({
                    originalPath: '/funding/funding-finder',
                    redirectedPath: '/funding/programmes'
                }),
                fundingFinderRequest({
                    originalPath: '/Home/Funding/Funding Finder',
                    redirectedPath: '/funding/programmes'
                }),
                fundingFinderRequest({
                    originalPath: '/funding/funding-finder?area=northern+ireland',
                    redirectedPath: '/funding/programmes?location=northernIreland'
                }),
                fundingFinderRequest({
                    originalPath: '/funding/funding-finder?area=England&amount=up to 10000',
                    redirectedPath: '/funding/programmes?location=england&max=10000'
                }),
                fundingFinderRequest({
                    originalPath: '/funding/funding-finder?area=Scotland&amp;amount=10001%20-%2050000',
                    redirectedPath: '/funding/programmes?location=scotland&min=10000'
                }),
                fundingFinderRequest({
                    originalPath: '/funding/funding-finder?cpage=1&area=uk-wide',
                    redirectedPath: '/funding/programmes?location=ukWide'
                }),
                fundingFinderRequest({
                    originalPath:
                        '/funding/funding-finder?area=Wales&amp;amount=up to 10000&amp;org=Voluntary or community organisation',
                    redirectedPath: '/funding/programmes?location=wales&max=10000'
                })
            ]).then(results => {
                results.forEach(result => {
                    expect(result.res.status).to.equal(301);
                    expect(result.res).to.redirectTo(result.redirectedPath);
                });
            });
        });

        it('should proxy old funding finder if requesting closed programmes', () => {
            return chai
                .request(server)
                .get('/funding/funding-finder?area=England&amp;amount=500001 - 1000000&amp;sc=1')
                .then(res => {
                    expect(res).to.have.header('X-BLF-Legacy', 'true');
                    expect(res.text).to.include('This is a list of our funding programmes');
                    expect(res.text).to.include('Show closed programmes');
                    expect(res.status).to.equal(200);
                });
        });
    });

    describe('Archived pages', () => {
        it('should redirect archived pages to the national archives', () => {
            const urlPath =
                '/funding/funding-guidance/applying-for-funding/help-using-our-electronic-application-forms';
            return requestRedirect(urlPath).then(res => {
                expect(res.status).to.equal(301);
                expect(res).to.redirectTo(
                    `http://webarchive.nationalarchives.gov.uk/*/https://www.biglotteryfund.org.uk${urlPath}`
                );
            });
        });
    });
});
