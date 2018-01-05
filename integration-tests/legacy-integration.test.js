'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('./helper');
const { legacyProxiedRoutes } = require('../controllers/routes');

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

    describe('Funding Finder Redirects', () => {
        function fundingFinderRequest(urlPath) {
            return chai
                .request(server)
                .get(urlPath)
                .redirects(0)
                .catch(err => err.response);
        }

        it('should redirect old funding finder', () => {
            return Promise.all([
                fundingFinderRequest('/funding/funding-finder'),
                fundingFinderRequest('/funding/funding-finder?area=England&amount=up to 10000'),
                fundingFinderRequest('/funding/funding-finder?area=Scotland&amp;amount=10001%20-%2050000'),
                fundingFinderRequest(
                    '/funding/funding-finder?area=Wales&amp;amount=up to 10000&amp;org=Voluntary or community organisation'
                )
            ]).then(responses => {
                const [responseA, responseB, responseC, responseD] = responses;
                responses.map(response => response.status).forEach(status => {
                    expect(status).to.equal(301);
                });

                expect(responseA).to.redirectTo('/funding/programmes');
                expect(responseB).to.redirectTo('/funding/programmes?location=england');
                expect(responseC).to.redirectTo('/funding/programmes?location=scotland&min=10000');
                expect(responseD).to.redirectTo('/funding/programmes?location=wales');
            });
        });

        it('should redirect additional funding finder routes', () => {
            fundingFinderRequest('/Home/Funding/Funding Finder').then(res => {
                expect(res).to.have.status(301);
                expect(res).to.redirectTo('/funding/programmes');
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

    describe('Awards For All Experiment', () => {
        it('should proxy the legacy awards for all pages', () => {
            return chai
                .request(server)
                .get(legacyProxiedRoutes.awardsForAllEngland.path)
                .then(res => {
                    expect(res).to.have.header('X-BLF-Legacy', 'true');
                    expect(res.text).to.include('National Lottery Awards for All');
                    expect(res.status).to.equal(200);
                });
        });
    });
});
