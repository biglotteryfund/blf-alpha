'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const { sampleSize } = require('lodash');
const helper = require('../helper');
const { vanityRedirects } = require('../../controllers/routes');

describe.only('Basic server tests', () => {
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

    it('should handle vanity URLs', () => {
        // Pick a random sample of vanity redirects to test
        const vanityRedirectSample = sampleSize(vanityRedirects, 6);
        const vanityRedirectAssertions = vanityRedirectSample.map(redirect => {
            return chai
                .request(server)
                .get(redirect.path)
                .redirects(0)
                .catch(err => err.response)
                .then(res => {
                    expect(res).to.have.status(301);
                    expect(res).to.redirectTo(redirect.destination);
                });
        });

        return Promise.all(vanityRedirectAssertions);
    });

    it('should pass unknown routes to the legacy site', () => {
        return chai
            .request(server)
            .get('/about-big/publications/corporate-documents')
            .then(res => {
                expect(res.status).to.equal(200);
                expect(res.text).to.include('Read our annual reports and accounts');
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
