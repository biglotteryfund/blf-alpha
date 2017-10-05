'use strict';
const chai = require('chai');
chai.use(require('chai-http'));
chai.should();

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const helper = require('../helper');
const routes = require('../../controllers/routes');

// test the order form specifically
describe('Material order form', () => {
    let agent, csrfToken, server;

    beforeEach(done => {
        server = helper.before();

        // grab a valid CSRF token
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;
        agent = chai.request.agent(server);
        agent.get(path).end((err, res) => {
            // res.should.have.cookie('_csrf');
            const dom = new JSDOM(res.text);
            csrfToken = dom.window.document.querySelector('input[name=_csrf]').value;
            done();
        });
    });

    afterEach(() => {
        helper.after();
    });

    it('should serve materials to order', done => {
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;
        chai
            .request(server)
            .get(path)
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('should allow adding a product to an order via AJAX', done => {
        const itemId = 1;
        const itemCode = 'BIG-PLAQAS';
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;

        agent
            .post(path + '/item/' + itemId)
            .set('Accept', 'application/json')
            .send({
                _csrf: csrfToken,
                code: itemCode,
                action: 'increase'
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

    it('should allow incrementing a product in an order via AJAX', done => {
        const itemId = 1;
        const itemCode = 'BIG-PLAQAS';
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;

        const formData = {
            _csrf: csrfToken,
            code: itemCode,
            action: 'increase'
        };

        // add the first item
        agent
            .post(path + '/item/' + itemId)
            .set('Accept', 'application/json')
            .send(formData)
            .end(() => {
                // add the second item
                agent
                    .post(path + '/item/' + itemId)
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

    it('should allow decrementing a product in an order via AJAX', done => {
        const itemId = 1;
        const itemCode = 'BIG-PLAQAS';
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;

        const formData = {
            _csrf: csrfToken,
            code: itemCode,
            action: 'increase'
        };

        // add the first item
        agent
            .post(path + '/item/' + itemId)
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
                agent
                    .post(path + '/item/' + itemId)
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

    it('should allow ordering with personal details', done => {
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;

        const formData = {
            _csrf: csrfToken,
            skipEmail: true,
            yourName: 'Little Bobby Tables',
            yourEmail: 'bobby@xkcd.com',
            yourNumber: '123456789',
            yourAddress1: '123 Fake Street',
            yourAddress2: 'Notrealsville',
            yourTown: 'Madeuptown',
            yourCounty: 'Nonexistentland',
            yourPostcode: 'NW1 6XE',
            yourProjectName: 'White Hat Testing',
            yourProjectID: '666',
            yourGrantAmount: '£2038'
        };

        agent
            .post(path)
            .send(formData)
            .redirects(0)
            .end((err, res) => {
                res.body.should.have.property('yourEmail');
                res.body.yourEmail.should.equal('bobby@xkcd.com');
                done();
            });
    });

    it('should block ordering with missing personal details', done => {
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;

        const formData = {
            _csrf: csrfToken,
            skipEmail: true,
            yourName: 'Little Bobby Tables'
        };

        agent
            .post(path)
            .send(formData)
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo(
                    '/funding/funding-guidance/managing-your-funding/ordering-free-materials#your-details'
                );
                res.should.have.status(302);
                done();
            });
    });
});
