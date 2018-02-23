/* eslint-env mocha */
const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const http = require('http');
const httpMocks = require('node-mocks-http');

const { csrfProtection, defaultVary, defaultCacheControl, noCache, sMaxAge, toSeconds } = require('./cached');

function createAppWithDefaults() {
    const app = express();
    app.use(defaultVary, defaultCacheControl);
    return app;
}

describe('cached', () => {
    it('should convert natural time to seconds', () => {
        expect(toSeconds('10s')).to.equal(10);
        expect(toSeconds('30m')).to.equal(1800);
    });

    it('should add default vary header', () => {
        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        defaultVary(req, res, () => {});
        expect(res.header('Vary')).to.equal('Cookie');
    });

    it('should add default cache-control header', done => {
        const app = createAppWithDefaults();
        app.get('/', function(req, res) {
            res.send('Hello');
        });
        const server = http.createServer(app);

        chai
            .request(server)
            .get('/')
            .end((err, res) => {
                expect(res.headers['cache-control']).to.equal('max-age=30,s-maxage=300');
                done();
            });

        after(function(afterDone) {
            server.close(afterDone);
        });
    });

    it('should add no-cache headers when middleware is used', done => {
        const app = createAppWithDefaults();
        app.get('/', noCache, function(req, res) {
            res.send('Hello');
        });
        const server = http.createServer(app);

        chai
            .request(server)
            .get('/')
            .end((err, res) => {
                expect(res.headers['cache-control']).to.equal('no-store,no-cache,max-age=0');
                done();
            });

        after(function(afterDone) {
            server.close(afterDone);
        });
    });

    it('should should add no-cache headers and csrf token at the same time', done => {
        const app = createAppWithDefaults();
        app.use(cookieParser());
        app.use(
            session({
                secret: 'keyboard cat',
                resave: false,
                saveUninitialized: true,
                cookie: { secure: true }
            })
        );

        let csrf;
        app.get('/', csrfProtection, function(req, res) {
            csrf = req.csrfToken();
            res.send(csrf);
        });

        const server = http.createServer(app);

        chai
            .request(server)
            .get('/')
            .end((err, res) => {
                expect(res.text).to.equal(csrf);
                expect(res.headers['cache-control']).to.equal('no-store,no-cache,max-age=0');
                done();
            });

        after(function(afterDone) {
            server.close(afterDone);
        });
    });

    it('should add custom s-max-age', done => {
        const app = createAppWithDefaults();
        app.get('/', sMaxAge('30m'), function(req, res) {
            res.send('Hello');
        });
        const server = http.createServer(app);

        chai
            .request(server)
            .get('/')
            .end((err, res) => {
                expect(res.headers['cache-control']).to.equal('max-age=30,s-maxage=1800');
                done();
            });

        after(function(afterDone) {
            server.close(afterDone);
        });
    });
});
