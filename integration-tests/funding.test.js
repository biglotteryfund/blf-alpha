'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('./helper');

describe.only('Funding programmes', () => {
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

    function fundingFinderRequest(urlPath) {
        return chai
            .request(server)
            .get(urlPath)
            .redirects(0)
            .catch(err => err.response);
    }

    it('Should redirect old funding finder', () => {
        return Promise.all([
            fundingFinderRequest('/funding/funding-finder'),
            fundingFinderRequest('/funding/funding-finder?area=Scotland&amp;amount=10001 - 50000'),
            fundingFinderRequest(
                '/funding/funding-finder?area=Wales&amp;amount=up to 10000&amp;org=Voluntary or community organisation'
            )
        ]).then(responses => {
            const [responseA, responseB, responseC] = responses;
            responses.map(response => response.status).forEach(status => {
                expect(status).to.equal(301);
            });

            expect(responseA).to.redirectTo('/funding/programmes');
            expect(responseB).to.redirectTo('/funding/programmes?location=scotland&min=10000');
            expect(responseC).to.redirectTo('/funding/programmes?location=wales');
        });
    });

    it('Should redirect additional funding finder routes', () => {
        fundingFinderRequest('/Home/Funding/Funding Finder').then(res => {
            expect(res).to.have.status(301);
            expect(res).to.redirectTo('/funding/programmes');
        });
    });
});
