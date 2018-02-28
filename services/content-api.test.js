/* eslint-env mocha */
const chai = require('chai');
const nock = require('nock');
const expect = chai.expect;

const contentApi = require('./content-api');
const fixtureNews = require('./fixtures/promoted-news.json');
const fixtureProgrammesEn = require('./fixtures/funding-programmes-en.json');
const fixtureProgrammesCy = require('./fixtures/funding-programmes-cy.json');
const fixtureListRoutes = require('./fixtures/list-routes.json');

function mockEndpoint() {
    const mockApiUrl = 'https://content.example.com';
    contentApi.setApiUrl(mockApiUrl);
    expect(contentApi.getApiUrl()).to.equal(mockApiUrl);
    return nock(mockApiUrl);
}

describe('Content API', () => {
    beforeEach(() => {
        mockEndpoint()
            .get('/v1/en/promoted-news')
            .reply(200, JSON.stringify(fixtureNews, null, 2));

        mockEndpoint()
            .get('/v1/en/funding-programmes')
            .reply(200, JSON.stringify(fixtureProgrammesEn, null, 2));

        mockEndpoint()
            .get('/v1/cy/funding-programmes')
            .reply(200, JSON.stringify(fixtureProgrammesCy, null, 2));

        mockEndpoint()
            .get('/v1/list-routes')
            .reply(200, JSON.stringify(fixtureListRoutes, null, 2));
    });

    it('should fetch promoted news', () => {
        return contentApi
            .getPromotedNews({
                locale: 'en'
            })
            .then(news => {
                expect(news.length).to.equal(3);
                expect(news.map(_ => _.title)).to.have.members(['Test Article 1', 'Test Article 2', 'Test Article 3']);
            });
    });

    it('should fetch promoted news with limit', () => {
        mockEndpoint()
            .get('/v1/en/promoted-news')
            .reply(200, JSON.stringify(fixtureNews, null, 2));

        return contentApi
            .getPromotedNews({
                locale: 'en',
                limit: 2
            })
            .then(news => {
                expect(news.length).to.equal(2);
                expect(news.map(_ => _.title)).to.have.members(['Test Article 1', 'Test Article 2']);
            });
    });

    it('should fetch funding programmes', () => {
        return contentApi
            .getFundingProgrammes({
                locale: 'en'
            })
            .then(programmes => {
                expect(programmes.length).to.equal(5);
                expect(programmes.map(_ => _.content.title)).to.have.members([
                    'National Lottery Awards for All England',
                    'National Lottery Awards for All Wales',
                    'National Lottery Awards for All Scotland',
                    'Awards for All Northern Ireland',
                    'Reaching Communities England'
                ]);
            });
    });

    it.only('should fetch merged welsh funding programmes', () => {
        return contentApi
            .getFundingProgrammes({
                locale: 'cy'
            })
            .then(programmes => {
                expect(programmes.length).to.equal(5);
                expect(programmes.map(_ => _.content.title)).to.have.members([
                    'National Lottery Awards for All England',
                    'Arian i Bawb y Loteri Genedlaethol Cymru',
                    'Arian i Bawb y Loteri Genedlaethol Yr Alban',
                    'Arian i Bawb y Loteri Genedlaethol Gogledd Iwerddon',
                    'Reaching Communities England'
                ]);
            });
    });

    it('should fetch all canonical urls from the cms', () => {
        return contentApi.getRoutes().then(cmsRoutes => {
            expect(cmsRoutes.length).to.equal(3);
            expect(cmsRoutes.map(_ => _.path)).to.have.members([
                '/funding/information-checks',
                '/funding/programmes/awards-for-all-northern-ireland',
                '/funding/programmes/awards-from-the-uk-portfolio'
            ]);
        });
    });
});
