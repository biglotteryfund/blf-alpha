'use strict';
/* global describe, it, beforeEach, afterEach */
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

chai.use(chaiHttp);

describe('Express application', function () {
    let server;
    const assets = require('../assets');
    const CSS_PATH = assets.getCachebustedPath('stylesheets/style.css');

    beforeEach(function () {
        process.env.PORT = 8080;
        server = require('../bin/www');
    });

    afterEach(function () {
        server.close();
    });

    it('responds to /', function testSlash(done) {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('serves static files', (done) => {
        chai.request(server)
            .get('/' + CSS_PATH)
            .end((err, res) => {
                res.should.have.status(200);
                res.should.have.header('content-type', /^text\/css/);
                done();
            });
    });

    it('returns grant data for postcodes', function testSlash(done) {
        let validPostcode = 'B14 7EW';

        chai.request(server)
            .get('/lookup')
            .query({
                postcode: validPostcode
            })
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('redirects to homepage for invalid postcodes', function testSlash(done) {
        let invalidPostcode = 'ABC 123';
        chai.request(server)
            .get('/lookup')
            .query({
                postcode: invalidPostcode
            })
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo('/');
                res.should.have.status(302);
                done();
            });
    });

    it('404s everything else', function testPath(done) {
        chai.request(server)
            .get('/foo/bar')
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });
});