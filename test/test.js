'use strict';
/* global describe, it, beforeEach, afterEach */
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const routes = require('../routes/routes');

chai.use(chaiHttp);

let captureStream = (stream) => {
    let oldWrite = stream.write;
    let buf = '';
    stream.write = function(chunk, encoding, callback) {
        buf += chunk.toString(); // chunk is a String or Buffer
        oldWrite.apply(stream, arguments);
    };

    return {
        unhook: () => {
            stream.write = oldWrite;
        },
        captured: () => {
            return buf;
        }
    };
};

describe('Express application', function () {
    this.timeout(10000);
    let server, hook;
    const assets = require('../modules/assets');
    const CSS_PATH = assets.getCachebustedPath('stylesheets/style.css');

    beforeEach(() =>{
        process.env.PORT = 8090;
        server = require('../bin/www');
        hook = captureStream(process.stdout);
    });

    afterEach(() => {
        server.close();
        hook.unhook();
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
                    // res.should.have.cookie('_csrf');
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

        it('should allow ordering with personal details', (done) => {
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            const formData = {
                '_csrf': csrfToken,
                'skipEmail': true,
                'yourName': 'Little Bobby Tables',
                'yourEmail': 'bobby@xkcd.com',
                'yourNumber': '123456789',
                'yourAddress1': '123 Fake Street',
                'yourAddress2': 'Notrealsville',
                'yourTown': 'Madeuptown',
                'yourCounty': 'Nonexistentland',
                'yourPostcode': 'NW1 6XE',
                'yourProjectName': 'White Hat Testing',
                'yourProjectID': '666',
                'yourGrantAmount': '£2038'
            };

            agent.post(path)
                .send(formData)
                .redirects(0)
                .end((err, res) => {
                    res.should.redirectTo('/funding/funding-guidance/managing-your-funding/ordering-free-materials');
                    res.should.have.status(302);
                    done();
                });
        });

        it('should block ordering with missing personal details', (done) => {
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            const formData = {
                '_csrf': csrfToken,
                'skipEmail': true,
                'yourName': 'Little Bobby Tables'
            };

            agent.post(path)
                .send(formData)
                .redirects(0)
                .end((err, res) => {
                    res.should.redirectTo('/funding/funding-guidance/managing-your-funding/ordering-free-materials#your-details');
                    res.should.have.status(302);
                    done();
                });
        });

        /* tests to add
         *
         *  homepage loads properly, has news
         *  ebulletin signup
         *  session/db works
         *  tools pages are auth protected
         *  news CRUD works
         *  GA is loaded
         *  are form fields working as expected?
         *  contrast tool exists and sets cookies etc
         *  welsh URL serves welsh copy
         */

    });
});