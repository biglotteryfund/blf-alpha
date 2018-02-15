'use strict';

const chai = require('chai');
const { JSDOM } = require('jsdom');
const { URL } = require('url');
const { map } = require('lodash');
const config = require('config');

chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('../helper');

describe('Core sections and features', () => {
    let server;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => helper.after(server));

    let agent;
    beforeEach(() => {
        agent = chai.request.agent(server);
    });

    it('should contain meta title', () => {
        return chai
            .request(server)
            .get('/')
            .then(res => {
                expect(res).to.have.status(200);
                const metaTitle = `Home | Big Lottery Fund`;
                expect(res.text).to.include(`<title>${metaTitle}</title>`);
                expect(res.text).to.include(`<meta name="title" content="${metaTitle}">`);
                expect(res.text).to.include(`<meta property="og:title" content="${metaTitle}">`);
            });
    });

    it('should mark correct section as selected', () => {
        function testSection({ urlPath, activeSection }) {
            return chai
                .request(server)
                .get(urlPath)
                .then(res => {
                    expect(res.status).to.equal(200);

                    const { document } = new JSDOM(res.text).window;
                    const navItem = document.querySelector(`.qa-nav-link--${activeSection}`);

                    // Test the correct navigation item is selected
                    expect(navItem.classList.contains('is-selected')).to.be.true;
                });
        }

        return Promise.all([
            testSection({ urlPath: '/', activeSection: 'toplevel' }),
            testSection({ urlPath: '/funding', activeSection: 'funding' }),
            testSection({ urlPath: '/research', activeSection: 'research' }),
            testSection({ urlPath: '/about', activeSection: 'about' }),
            testSection({ urlPath: '/funding/programmes', activeSection: 'funding' })
        ]);
    });

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
                const navLinks = document.querySelectorAll('.qa-global-nav .qa-nav-link a');
                const navLinksText = map(navLinks, el => el.text);
                expect(navLinksText).to.have.members(['Hafan', 'Ariannu', 'Ymchwil', 'Amdanom ni']);
            });
    });

    it('should include correct language switcher for en locale', () => {
        return chai
            .request(server)
            .get('/funding/over10k')
            .then(res => {
                const { document } = new JSDOM(res.text).window;
                const langSwitcherHref = document.querySelector('.qa-lang-switcher').href;
                const urlPath = new URL(langSwitcherHref).pathname;
                expect(urlPath).to.equal('/welsh/funding/over10k');
            });
    });

    it('should include correct language switcher for cy locale', () => {
        return chai
            .request(server)
            .get('/welsh/funding/over10k')
            .then(res => {
                const { document } = new JSDOM(res.text).window;
                const langSwitcherHref = document.querySelector('.qa-lang-switcher').href;
                const urlPath = new URL(langSwitcherHref).pathname;
                expect(urlPath).to.equal('/funding/over10k');
            });
    });

    it('should allow contrast preferences to be set', () => {
        let redirectUrl = 'http://www.google.com';
        return chai
            .request(server)
            .get('/contrast/high')
            .query({
                url: redirectUrl
            })
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.cookie(config.get('cookies.contrast'));
                expect(res).to.redirectTo(redirectUrl);
                expect(res).to.have.status(302);
            });
    });

    it('should serve a list of programmes', () => {
        return chai
            .request(server)
            .get('/funding/programmes')
            .then(res => {
                const { document } = new JSDOM(res.text).window;
                const programmes = document.querySelectorAll('.qa-programme-card');
                expect(programmes.length).to.be.at.least(2);
            });
    });

    it('should redirect search queries to a google site search', () => {
        return chai
            .request(server)
            .get('/search')
            .query({
                q: 'This is my search query'
            })
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(302);
                expect(res).to.redirectTo(
                    'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+This%20is%20my%20search%20query'
                );
            });
    });

    it('should redirect legacy site search queries to google site search', () => {
        return chai
            .request(server)
            .get('/search?lang=en-GB&amp;q=something&amp;type=All&amp;order=r')
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(302);
                expect(res).to.redirectTo('https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+something');
            });
    });

    it('should redirect regional urls', () => {
        return Promise.all([
            helper.redirectRequest({
                agent: agent,
                originalPath: '/england/about-big/publications/corporate-documents',
                redirectedPath: '/about-big/publications/corporate-documents'
            }),
            helper.redirectRequest({
                agent: agent,
                originalPath: '/scotland/about-big/publications/corporate-documents',
                redirectedPath: '/about-big/publications/corporate-documents'
            }),
            helper.redirectRequest({
                agent: agent,
                originalPath: '/wales/about-big/publications/corporate-documents',
                redirectedPath: '/about-big/publications/corporate-documents'
            }),
            helper.redirectRequest({
                agent: agent,
                originalPath: '/northernireland/about-big/publications/corporate-documents',
                redirectedPath: '/about-big/publications/corporate-documents'
            })
        ]).then(results => {
            results.forEach(result => {
                expect(result.res.status).to.equal(301);
                expect(result.res).to.redirectTo(result.redirectedPath);
            });
        });
    });
});
