'use strict';

const chai = require('chai');
const { JSDOM } = require('jsdom');
const { URL } = require('url');
const { map } = require('lodash');

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

    describe('welsh translation', () => {
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

                    const { document } = new JSDOM(res.text).window;
                    const navLinks = document.querySelectorAll('.qa-nav-link a');
                    const navLinksText = map(navLinks, el => el.text);
                    expect(navLinksText).to.have.members(['Hafan', 'Ariannu', 'Ymchwil', 'Amdanom ni']);
                });
        });
    });

    describe('language switcher', () => {
        function langSwitherHref(res) {
            const { document } = new JSDOM(res.text).window;
            const langSwitcherHref = document.getElementById('qa-lang-switcher').href;
            const urlPath = new URL(langSwitcherHref).pathname;
            return urlPath;
        }

        it('has correct language for en locale', () => {
            chai
                .request(server)
                .get('/funding/programmes')
                .then(res => {
                    const urlPath = langSwitherHref(res);
                    expect(urlPath).to.equal('/welsh/funding/programmes');
                });
        });

        it('has correct language switcher for cy locale', () => {
            chai
                .request(server)
                .get('/welsh/funding/programmes')
                .then(res => {
                    const urlPath = langSwitherHref(res);
                    expect(urlPath).to.equal('/funding/programmes');
                });
        });
    });
});
