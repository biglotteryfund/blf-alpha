'use strict';
/* global describe, it, beforeEach, afterEach */
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const routes = require('../routes/routes');

const jsdom = require("jsdom");
const { JSDOM } = jsdom;

chai.use(chaiHttp);

describe('Express application', function () {
    let server;
    const assets = require('../assets');
    const CSS_PATH = assets.getCachebustedPath('stylesheets/style.css');

    beforeEach(() =>{
        process.env.PORT = 8090;
        server = require('../bin/www');
    });

    afterEach(() => {
        server.close();
    });

    it('responds to /', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('serves static files', (done) => {
        chai.request(server)
            .get(CSS_PATH)
            .end((err, res) => {
                res.should.have.status(200);
                res.should.have.header('content-type', /^text\/css/);
                done();
            });
    });

    it('returns grant data for postcodes', (done) => {
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
    }).timeout(3000);

    it('redirects to homepage for invalid postcodes', (done) => {
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
    }).timeout(3000);

    it('404s everything else', (done) => {
        chai.request(server)
            .get('/foo/bar')
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    // test the order form specifically
    describe("Material order form", () => {

        let agent;
        let csrfToken;

        beforeEach((done) => {
            // grab a valid CSRF token
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;
            agent = chai.request.agent(server);
            agent.get(path)
                .end((err, res) => {
                    res.should.have.cookie('_csrf');
                    const dom = new JSDOM(res.text);
                    csrfToken = dom.window.document.querySelector('input[name=_csrf]').value;
                    done();
                });
        });

        it('should serve materials to order', (done) => {
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;
            chai.request(server)
                .get(path)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('should allow adding a product to an order via AJAX', (done) => {
            const itemId = 1;
            const itemCode = 'BIG-PLAQAS';
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            agent.post(path + '/item/' + itemId)
                .set('Accept', 'application/json')
                .send({
                    '_csrf': csrfToken,
                    'code': itemCode,
                    'action': 'increase'
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.have.header('content-type', /^application\/json/);
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    res.body.should.have.property('quantity');
                    res.body.quantity.should.equal(1);
                    done();
                });
        });

        it('should allow incrementing a product in an order via AJAX', (done) => {
            const itemId = 1;
            const itemCode = 'BIG-PLAQAS';
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            const formData = {
                '_csrf': csrfToken,
                'code': itemCode,
                'action': 'increase'
            };

            // add the first item
            agent.post(path + '/item/' + itemId)
                .set('Accept', 'application/json')
                .send(formData)
                .end((err, res) => {
                    // add the second item
                    agent.post(path + '/item/' + itemId)
                        .set('Accept', 'application/json')
                        .send(formData)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.should.have.header('content-type', /^application\/json/);
                            res.body.should.have.property('status');
                            res.body.status.should.equal('success');
                            res.body.should.have.property('quantity');
                            res.body.quantity.should.equal(2);
                            done();
                        });
                });

        });

        it('should allow decrementing a product in an order via AJAX', (done) => {
            const itemId = 1;
            const itemCode = 'BIG-PLAQAS';
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            const formData = {
                '_csrf': csrfToken,
                'code': itemCode,
                'action': 'increase'
            };

            // add the first item
            agent.post(path + '/item/' + itemId)
                .set('Accept', 'application/json')
                .send(formData)
                .end((err, res) => {

                    // check it was added
                    res.should.have.status(200);
                    res.should.have.header('content-type', /^application\/json/);
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    res.body.should.have.property('quantity');
                    res.body.quantity.should.equal(1);

                    // now remove the first item
                    formData.action = 'decrease';
                    agent.post(path + '/item/' + itemId)
                        .set('Accept', 'application/json')
                        .send(formData)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.should.have.header('content-type', /^application\/json/);
                            res.body.should.have.property('status');
                            res.body.status.should.equal('success');
                            res.body.should.have.property('quantity');
                            res.body.quantity.should.equal(0);
                            done();
                        });
                });

        });

    });
});