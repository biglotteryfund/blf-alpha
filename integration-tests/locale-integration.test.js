'use strict';

const chai = require('chai');
const cheerio = require('cheerio');
const { URL } = require('url');

chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('./helper');

describe('locale integration tests', () => {
    let server;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => helper.after(server));

    it('serves welsh content', () => {
        return chai
            .request(server)
            .get('/welsh')
            .then(res => {
                expect(res).to.have.status(200);
                expect(res).to.have.header('Content-Language', 'cy');

                const metaTitle = `Hafan | Cronfa Loteri Fawr`;
                expect(res.text).to.include(`<title>${metaTitle}</title>`);
                expect(res.text).to.include(`<meta name="title" content="${metaTitle}">`);
                expect(res.text).to.include(`<meta property="og:title" content="${metaTitle}">`);

                const $ = cheerio.load(res.text);
                const navLinks = $('.qa-nav-link a');
                const navLinksText = navLinks.map((i, el) => $(el).text()).get();
                expect(navLinksText).to.have.members(['Hafan', 'Ariannu', 'Ymchwil', 'Amdanom ni']);
            });
    });

    it('has correct language for en locale', () => {
        chai
            .request(server)
            .get('/funding/programmes')
            .then(res => {
                const $ = cheerio.load(res.text);
                const langSwitcherHref = $('#qa-lang-switcher').attr('href');
                const urlPath = new URL(langSwitcherHref).pathname;
                expect(urlPath).to.equal('/welsh/funding/programmes');
            });
    });

    it('has correct language switcher for cy locale', () => {
        chai
            .request(server)
            .get('/welsh/funding/programmes')
            .then(res => {
                const $ = cheerio.load(res.text);
                const langSwitcherHref = $('#qa-lang-switcher').attr('href');
                const urlPath = new URL(langSwitcherHref).pathname;
                expect(urlPath).to.equal('/funding/programmes');
            });
    });
});
