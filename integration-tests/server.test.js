'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const config = require('config');
const helper = require('./helper');

describe('Express application', () => {
    let server;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => helper.after(server));

    it('responds to /', () => {
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

    it('serves static files', () => {
        const assets = require('../modules/assets');
        const CSS_PATH = assets.getCachebustedPath('stylesheets/style.css');
        return chai
            .request(server)
            .get(CSS_PATH)
            .then(res => {
                expect(res).to.have.status(200);
                expect(res).to.have.header('content-type', /^text\/css/);
            });
    });

    it('can set contrast preferences', () => {
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

    it('404s everything else', () => {
        return chai
            .request(server)
            .get('/foo/bar')
            .catch(err => err.response)
            .then(res => {
                expect(res.text).to.include('Error 404 | Big Lottery Fund');
                expect(res).to.have.status(404);
            });
    });
});
