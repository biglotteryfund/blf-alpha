'use strict';

const chai = require('chai');
const { JSDOM } = require('jsdom');
const { URL } = require('url');
const { map } = require('lodash');

chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('./helper');

describe('Locale integration tests', () => {
    let server;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => helper.after(server));

    describe('Welsh translation', () => {
        it('should serve welsh content', () => {
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

    describe('Language switcher', () => {
        it('should include correct language switcher for en locale', () => {
            return chai
                .request(server)
                .get('/over10k')
                .then(res => {
                    const { document } = new JSDOM(res.text).window;
                    const langSwitcherHref = document.querySelector('.qa-lang-switcher').href;
                    const urlPath = new URL(langSwitcherHref).pathname;
                    expect(urlPath).to.equal('/welsh/over10k');
                });
        });

        it('should include correct language switcher for cy locale', () => {
            return chai
                .request(server)
                .get('/welsh/over10k')
                .then(res => {
                    const { document } = new JSDOM(res.text).window;
                    const langSwitcherHref = document.querySelector('.qa-lang-switcher').href;
                    const urlPath = new URL(langSwitcherHref).pathname;
                    expect(urlPath).to.equal('/over10k');
                });
        });
    });
});
