'use strict';
/* global describe, it, before, beforeEach, after, afterEach */
const chai = require('chai');
const _ = require('lodash');
chai.use(require('chai-http'));
const should = chai.should();
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

const helper = require('../helper');
const routes = require('../../routes/routes');
const models = require('../../models/index');

describe("Survey tool", () => {

    let agent, csrfToken, server, storedSurveyData;

    let testSurveyData = {
        name: 'Test Survey',
        question_en: 'What is the meaning of life?',
        question_cy: 'Beth yw ystyr bywyd?',
        activePath: '/foo',
        active: 1,
        choices: [
            {
                title_en: '42',
                title_cy: '42',
                allow_message: false
            },
            {
                title_en: 'Nothing',
                title_cy: 'Dim byd',
                allow_message: true
            }
        ]
    };

    // create initial survey for testing
    before((done) => {
        models.Survey.create(testSurveyData, {
            include: [{
                model: models.SurveyChoice,
                as: 'choices'
            }]
        }).then((data) => {
            // store our survey data to test against
            storedSurveyData = data;
            done();
        });
    });

    beforeEach((done) => {
        server = helper.before();

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

    afterEach((done) => {
        helper.after();
        done();
    });

    // @TODO clean up this tidying code
    // this is pretty awful: hard-coded table names, disabling foreign key checks...
    // initially tried sequelize's truncate({cascade: true}) method but got FK errors
    // it might be down to how these three tables are cross-referenced?
    after((done) => {
        models.sequelize.transaction((t) => {
            let options = { raw: true, transaction: t };

            return models.sequelize
                .query('SET FOREIGN_KEY_CHECKS = 0', options)
                .then(() => {
                    return [
                        models.sequelize.query('truncate table surveys', options),
                        models.sequelize.query('truncate table survey_choices', options),
                        models.sequelize.query('truncate table survey_responses', options)
                    ];
                })
                .then(() => {
                    return models.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', options);
                });
        }).then(() => {
            done();
        });
    });

    it('should accept valid survey responses', (done) => {
        // grab a random choice from the database
        let surveyData = {
            '_csrf': csrfToken,
            choice: _.shuffle(storedSurveyData.choices)[0].id,
            message: "Hello from the other side"
        };

        // submit the choice to its parent survey
        agent.post(`/survey/${storedSurveyData.id}`)
            .set('Accept', 'application/json')
            .send(surveyData)
            .end((err, res) => {
                res.should.have.status(200);
                res.should.have.header('content-type', /^application\/json/);
                res.body.should.have.property('status');
                res.body.status.should.equal('success');
                done();
            });
    });

    it('should ignore invalid survey responses', (done) => {
        // grab a random choice from the database
        let surveyData = {
            '_csrf': csrfToken,
            choice: 111111
        };

        agent.post(`/survey/222222`)
            .set('Accept', 'application/json')
            .send(surveyData)
            .end((err, res) => {
                res.should.have.status(400);
                res.should.have.header('content-type', /^application\/json/);
                res.body.should.have.property('status');
                res.body.status.should.equal('error');
                done();
            });
    });

    it('should ignore missing survey responses', (done) => {
        // grab a random choice from the database
        let surveyData = {
            '_csrf': csrfToken
        };

        agent.post(`/survey/333333`)
            .set('Accept', 'application/json')
            .send(surveyData)
            .end((err, res) => {
                res.should.have.status(400);
                res.should.have.header('content-type', /^application\/json/);
                res.body.should.have.property('status');
                res.body.status.should.equal('error');
                done();
            });
    });

    // it('should serve materials to order', (done) => {
    //     const funding = routes.sections.funding;
    //     const path = funding.path + funding.pages.freeMaterials.path;
    //     chai.request(server)
    //         .get(path)
    //         .end((err, res) => {
    //             res.should.have.status(200);
    //             done();
    //         });
    // });
    //
    // it('should allow adding a product to an order via AJAX', (done) => {
    //     const itemId = 1;
    //     const itemCode = 'BIG-PLAQAS';
    //     const funding = routes.sections.funding;
    //     const path = funding.path + funding.pages.freeMaterials.path;
    //
    //     agent.post(path + '/item/' + itemId)
    //         .set('Accept', 'application/json')
    //         .send({
    //             '_csrf': csrfToken,
    //             'code': itemCode,
    //             'action': 'increase'
    //         })
    //         .end((err, res) => {
    //             res.should.have.status(200);
    //             res.should.have.header('content-type', /^application\/json/);
    //             res.body.should.have.property('status');
    //             res.body.status.should.equal('success');
    //             res.body.should.have.property('quantity');
    //             res.body.quantity.should.equal(1);
    //             done();
    //         });
    // });
    //
    // it('should allow incrementing a product in an order via AJAX', (done) => {
    //     const itemId = 1;
    //     const itemCode = 'BIG-PLAQAS';
    //     const funding = routes.sections.funding;
    //     const path = funding.path + funding.pages.freeMaterials.path;
    //
    //     const formData = {
    //         '_csrf': csrfToken,
    //         'code': itemCode,
    //         'action': 'increase'
    //     };
    //
    //     // add the first item
    //     agent.post(path + '/item/' + itemId)
    //         .set('Accept', 'application/json')
    //         .send(formData)
    //         .end((err, res) => {
    //             // add the second item
    //             agent.post(path + '/item/' + itemId)
    //                 .set('Accept', 'application/json')
    //                 .send(formData)
    //                 .end((err, res) => {
    //                     res.should.have.status(200);
    //                     res.should.have.header('content-type', /^application\/json/);
    //                     res.body.should.have.property('status');
    //                     res.body.status.should.equal('success');
    //                     res.body.should.have.property('quantity');
    //                     res.body.quantity.should.equal(2);
    //                     done();
    //                 });
    //         });
    //
    // });
    //
    // it('should allow decrementing a product in an order via AJAX', (done) => {
    //     const itemId = 1;
    //     const itemCode = 'BIG-PLAQAS';
    //     const funding = routes.sections.funding;
    //     const path = funding.path + funding.pages.freeMaterials.path;
    //
    //     const formData = {
    //         '_csrf': csrfToken,
    //         'code': itemCode,
    //         'action': 'increase'
    //     };
    //
    //     // add the first item
    //     agent.post(path + '/item/' + itemId)
    //         .set('Accept', 'application/json')
    //         .send(formData)
    //         .end((err, res) => {
    //
    //             // check it was added
    //             res.should.have.status(200);
    //             res.should.have.header('content-type', /^application\/json/);
    //             res.body.should.have.property('status');
    //             res.body.status.should.equal('success');
    //             res.body.should.have.property('quantity');
    //             res.body.quantity.should.equal(1);
    //
    //             // now remove the first item
    //             formData.action = 'decrease';
    //             agent.post(path + '/item/' + itemId)
    //                 .set('Accept', 'application/json')
    //                 .send(formData)
    //                 .end((err, res) => {
    //                     res.should.have.status(200);
    //                     res.should.have.header('content-type', /^application\/json/);
    //                     res.body.should.have.property('status');
    //                     res.body.status.should.equal('success');
    //                     res.body.should.have.property('quantity');
    //                     res.body.quantity.should.equal(0);
    //                     done();
    //                 });
    //         });
    // });
    //
    // it('should allow ordering with personal details', (done) => {
    //     const funding = routes.sections.funding;
    //     const path = funding.path + funding.pages.freeMaterials.path;
    //
    //     const formData = {
    //         '_csrf': csrfToken,
    //         'skipEmail': true,
    //         'yourName': 'Little Bobby Tables',
    //         'yourEmail': 'bobby@xkcd.com',
    //         'yourNumber': '123456789',
    //         'yourAddress1': '123 Fake Street',
    //         'yourAddress2': 'Notrealsville',
    //         'yourTown': 'Madeuptown',
    //         'yourCounty': 'Nonexistentland',
    //         'yourPostcode': 'NW1 6XE',
    //         'yourProjectName': 'White Hat Testing',
    //         'yourProjectID': '666',
    //         'yourGrantAmount': '£2038'
    //     };
    //
    //     agent.post(path)
    //         .send(formData)
    //         .redirects(0)
    //         .end((err, res) => {
    //             res.body.should.have.property('yourEmail');
    //             res.body.yourEmail.should.equal('bobby@xkcd.com');
    //             done();
    //         });
    // });
    //
    // it('should block ordering with missing personal details', (done) => {
    //     const funding = routes.sections.funding;
    //     const path = funding.path + funding.pages.freeMaterials.path;
    //
    //     const formData = {
    //         '_csrf': csrfToken,
    //         'skipEmail': true,
    //         'yourName': 'Little Bobby Tables'
    //     };
    //
    //     agent.post(path)
    //         .send(formData)
    //         .redirects(0)
    //         .end((err, res) => {
    //             res.should.redirectTo('/funding/funding-guidance/managing-your-funding/ordering-free-materials#your-details');
    //             res.should.have.status(302);
    //             done();
    //         });
    // });
});