'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const config = require('config');
const helper = require('../helper');

describe('Basic server tests', () => {
    let server;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => helper.after(server));

    it('should respond to /', () => {
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

    it('should redirect trailing slashes', () => {
        function redirectRequest({ originalPath, redirectedPath }) {
            return chai
                .request(server)
                .get(originalPath)
                .redirects(0)
                .catch(err => err.response)
                .then(res => {
                    return {
                        res,
                        originalPath,
                        redirectedPath
                    };
                });
        }

        return Promise.all([
            redirectRequest({
                originalPath: '/funding/',
                redirectedPath: '/funding'
            }),
            redirectRequest({
                originalPath: '/funding/programmes/?location=wales',
                redirectedPath: '/funding/programmes?location=wales'
            })
        ]).then(results => {
            results.forEach(result => {
                expect(result.res.status).to.equal(301);
                expect(result.res).to.redirectTo(result.redirectedPath);
            });
        });
    });

    it('should serve static files', () => {
        return chai
            .request(server)
            .get('/assets/images/favicon/apple-icon.png')
            .then(res => {
                expect(res).to.have.status(200);
                expect(res).to.have.header('content-type', /^image\/png/);
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

    it('should 404 everything else', () => {
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
