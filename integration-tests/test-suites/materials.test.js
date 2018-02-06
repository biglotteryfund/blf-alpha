'use strict';
const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('../helper');
const routes = require('../../controllers/routes');

describe('Material order form', () => {
    let server, agent;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => {
        helper.after(server);
    });

    beforeEach(() => {
        agent = chai.request.agent(server);
    });

    let csrfToken;
    beforeEach(async () => {
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;
        csrfToken = await helper.getCsrfToken(agent, path);
    });

    function assertQuantity(res, quantity) {
        expect(res).to.have.status(200);
        expect(res).to.have.header('content-type', /^application\/json/);
        expect(res.body).to.have.property('status');
        expect(res.body.status).to.equal('success');
        expect(res.body).to.have.property('quantity');
        expect(res.body.quantity).to.equal(quantity);
    }

    it('should serve materials to order', () => {
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;
        return chai
            .request(server)
            .get(path)
            .then(res => {
                expect(res.status).to.equal(200);
            });
    });

    it('should allow adding a product to an order via AJAX', () => {
        const itemId = 1;
        const itemCode = 'BIG-PLAQAS';
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;

        return agent
            .post(path + '/item/' + itemId)
            .set('Accept', 'application/json')
            .send({
                _csrf: csrfToken,
                code: itemCode,
                action: 'increase'
            })
            .then(res => {
                assertQuantity(res, 1);
            });
    });

    it('should allow incrementing a product in an order via AJAX', () => {
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
        return agent
            .post(path + '/item/' + itemId)
            .set('Accept', 'application/json')
            .send(formData)
            .then(() => {
                // add the second item
                return agent
                    .post(path + '/item/' + itemId)
                    .set('Accept', 'application/json')
                    .send(formData)
                    .then(res => {
                        assertQuantity(res, 2);
                    });
            });
    });

    it('should allow decrementing a product in an order via AJAX', () => {
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
        return agent
            .post(path + '/item/' + itemId)
            .set('Accept', 'application/json')
            .send(formData)
            .then(res => {
                // check it was added
                assertQuantity(res, 1);

                // now remove the first item
                formData.action = 'decrease';
                return agent
                    .post(path + '/item/' + itemId)
                    .set('Accept', 'application/json')
                    .send(formData)
                    .then(decreaseRes => {
                        assertQuantity(decreaseRes, 0);
                    });
            });
    });

    it('should allow ordering with personal details', () => {
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;

        return agent
            .post(path)
            .send({
                _csrf: csrfToken,
                skipEmail: true,
                yourName: 'Little Bobby Tables',
                yourEmail: 'bobby@xkcd.com',
                yourAddress1: '123 Fake Street',
                yourAddress2: 'Notrealsville',
                yourTown: 'Madeuptown',
                yourCounty: 'Nonexistentland',
                yourCountry: 'Sealand',
                yourPostcode: 'NW1 6XE',
                yourProjectName: 'White Hat Testing',
                yourGrantAmount: 'over10k',
                yourReason: 'event'
            })
            .redirects(0)
            .then(res => {
                expect(res.body).to.have.property('yourEmail');
                expect(res.body.yourEmail).to.equal('bobby@xkcd.com');
                // ensure optional fields are returned too
                expect(res.body).to.have.property('yourAddress2');
                expect(res.body.yourAddress2).to.equal('Notrealsville');
            });
    });

    it('should block ordering with missing personal details', () => {
        const funding = routes.sections.funding;
        const path = funding.path + funding.pages.freeMaterials.path;

        return agent
            .post(path)
            .send({
                _csrf: csrfToken,
                skipEmail: true,
                yourName: 'Little Bobby Tables'
            })
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.redirectTo(
                    '/funding/funding-guidance/managing-your-funding/ordering-free-materials#your-details'
                );
                expect(res.status).to.equal(302);
            });
    });
});
