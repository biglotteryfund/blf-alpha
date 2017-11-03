'use strict';
/* global describe, it, before, beforeEach, after, afterEach */
const chai = require('chai');
const _ = require('lodash');
chai.use(require('chai-http'));
chai.should();

const helper = require('./helper');
const models = require('../../models/index');

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

describe('Survey tool', () => {
    let agent, server, storedSurveyData;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;

            // create initial survey for testing
            models.Survey
                .create(testSurveyData, {
                    include: [
                        {
                            model: models.SurveyChoice,
                            as: 'choices'
                        }
                    ]
                })
                .then(data => {
                    // store our survey data to test against
                    storedSurveyData = data;
                    done();
                })
                .catch(() => {
                    helper.after(server);
                    done(new Error('Error deleting users'));
                });
        });
    });

    after(() => {
        helper.after(server);
    });

    beforeEach(() => {
        agent = chai.request.agent(server);
    });

    it('should accept valid survey responses', done => {
        // grab a random choice from the database
        let surveyData = {
            choice: _.shuffle(storedSurveyData.choices)[0].id,
            message: 'Hello from the other side'
        };

        // submit the choice to its parent survey
        agent
            .post(`/survey/${storedSurveyData.id}`)
            .set('Accept', 'application/json')
            .send(surveyData)
            .end((err, res) => {
                console.log(err);
                res.should.have.status(200);
                res.should.have.header('content-type', /^application\/json/);
                res.body.should.have.property('status');
                res.body.status.should.equal('success');
                done();
            });
    });

    it('should ignore invalid survey responses', done => {
        let surveyData = {
            choice: 111111
        };

        agent
            .post(`/survey/222222`)
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

    it('should ignore missing survey responses', done => {
        agent
            .post(`/survey/333333`)
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.should.have.status(400);
                res.should.have.header('content-type', /^application\/json/);
                res.body.should.have.property('status');
                res.body.status.should.equal('error');
                done();
            });
    });
});
