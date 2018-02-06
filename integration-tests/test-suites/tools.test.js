'use strict';
/* global describe, it, before, beforeEach, afterEach, after */
const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('../helper');

const validUser = {
    username: 'test@fakewebsite.com',
    password: 'hunter2',
    level: 10
};

describe('CMS Tools', function() {
    let server, agent;

    // set up pre-test dependencies
    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;

            // make a test user
            helper
                .createTestUser(validUser)
                .then(() => {
                    done();
                })
                .catch(err => {
                    done(new Error(err));
                });
        });
    });

    // delete test users afterward
    after(done => {
        helper
            .truncateUsers()
            .then(() => {
                helper.after(server);
                done();
            })
            .catch(() => {
                helper.after(server);
                done(new Error('Error deleting users'));
            });
    });

    let csrfToken;
    beforeEach(async () => {
        agent = chai.request.agent(server);
        csrfToken = await helper.getCsrfToken(agent, '/user/login');
    });

    it('should block access to staff-only tools', () => {
        return agent
            .get('/tools/survey-results')
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.redirectTo('/user/login');
                expect(res).to.have.status(302);
            });
    });

    it('should not allow unauthorised access to staff-only tools', () => {
        return agent
            .post('/user/login')
            .send({
                _csrf: csrfToken,
                username: 'test@test.com',
                password: 'wrong'
            })
            .then(postRes => {
                expect(postRes.text).to.match(/(.*)Your username and password combination is invalid(.*)/);
                return agent
                    .get('/tools/survey-results')
                    .redirects(0)
                    .catch(err => err.response)
                    .then(res => {
                        expect(res).to.have.status(302);
                    });
            });
    });

    it('should allow authorised access to staff-only tools', () => {
        return agent
            .post('/user/login')
            .send({
                _csrf: csrfToken,
                username: validUser.username,
                password: validUser.password,
                redirectUrl: '/tools/survey-results'
            })
            .redirects(0)
            .catch(err => err.response)
            .then(postRes => {
                expect(postRes).to.have.status(302);
                expect(postRes).to.redirectTo('/tools/survey-results');
                return agent.get('/tools/survey-results/').then(res => {
                    expect(res).to.have.status(200);
                });
            });
    });
});
