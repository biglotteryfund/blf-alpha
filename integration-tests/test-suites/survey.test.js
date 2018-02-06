'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const { shuffle } = require('lodash');
const helper = require('../helper');
const surveyService = require('../../services/surveys');

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

describe('Surveys', () => {
    let agent, server, storedSurveyData;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;

            // create initial survey for testing
            surveyService
                .createWithChoices(testSurveyData)
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

    it('should accept valid survey responses', () => {
        // grab a random choice from the database
        let surveyData = {
            choice: shuffle(storedSurveyData.choices)[0].id,
            message: 'Hello from the other side'
        };

        // submit the choice to its parent survey
        return agent
            .post(`/survey/${storedSurveyData.id}`)
            .set('Accept', 'application/json')
            .send(surveyData)
            .then(res => {
                expect(res).to.have.status(200);
                expect(res).to.have.header('content-type', /^application\/json/);
                expect(res.body).to.have.property('status');
                expect(res.body.status).to.equal('success');
            });
    });

    it('should ignore invalid survey responses', () => {
        return agent
            .post(`/survey/222222`)
            .set('Accept', 'application/json')
            .send({
                choice: 111111
            })
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(400);
                expect(res).to.have.header('content-type', /^application\/json/);
                expect(res.body).to.have.property('status');
                expect(res.body.status).to.equal('error');
            });
    });

    it('should ignore missing survey responses', () => {
        return agent
            .post(`/survey/333333`)
            .set('Accept', 'application/json')
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(400);
                expect(res).to.have.header('content-type', /^application\/json/);
                expect(res.body).to.have.property('status');
                expect(res.body.status).to.equal('error');
            });
    });
});
