'use strict';

const chai = require('chai');
const config = require('config');
chai.use(require('chai-http'));
chai.should();

const helper = require('./helper');
const { legacyProxiedRoutes } = require('../controllers/routes');

describe('Express application', () => {
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

    it('responds to /', done => {
        chai
            .request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('serves the new homepage', done => {
        chai
            .request(server)
            .get('/home')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('serves the legacy homepage', done => {
        chai
            .request(server)
            .get('/legacy')
            .end((err, res) => {
                // verify that our proxied page has been correct modified
                res.should.have.header('X-BLF-Legacy', 'true');
                res.should.have.status(200);
                done();
            });
    });

    it('serves static files', done => {
        const assets = require('../modules/assets');
        const CSS_PATH = assets.getCachebustedPath('stylesheets/style.css');
        chai
            .request(server)
            .get(CSS_PATH)
            .end((err, res) => {
                res.should.have.status(200);
                res.should.have.header('content-type', /^text\/css/);
                done();
            });
    });

    it('serves Welsh content', done => {
        chai
            .request(server)
            .get('/welsh/contact')
            .end((err, res) => {
                res.should.have.header('Content-Language', 'cy');
                res.should.have.status(200);
                done();
            });
    });

    it('can set contrast preferences', done => {
        let redirectUrl = 'http://www.google.com';
        chai
            .request(server)
            .get('/contrast/high')
            .query({
                url: redirectUrl
            })
            .redirects(0)
            .end((err, res) => {
                res.should.have.cookie(config.get('cookies.contrast'));
                res.should.redirectTo(redirectUrl);
                res.should.have.status(302);
                done();
            });
    });

    it('404s everything else', done => {
        chai
            .request(server)
            .get('/foo/bar')
            .end((err, res) => {
                res.text.should.include('Error 404 | Big Lottery Fund');
                res.should.have.status(404);
                done();
            });
    });

    it('proxies the legacy awards for all pages', done => {
        chai
            .request(server)
            .get(legacyProxiedRoutes.awardsForAllEngland.path)
            .end((err, res) => {
                res.should.have.header('X-BLF-Legacy', 'true');
                res.text.should.include('National Lottery Awards for All');
                res.should.have.status(200);
                done();
            });
    });
});
