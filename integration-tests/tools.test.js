'use strict';
/* global describe, it, before, beforeEach, afterEach, after */
const chai = require('chai');
chai.use(require('chai-http'));
chai.should();

const helper = require('./helper');

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

    beforeEach(() => {
        agent = chai.request.agent(server);
    });

    describe('authorisation for tools', () => {
        let csrfToken;
        beforeEach(async () => {
            csrfToken = await helper.getCsrfToken(agent, '/user/login');
        });

        it('should block access to staff-only tools', done => {
            agent
                .get('/tools/survey-results')
                .redirects(0)
                .end((err, res) => {
                    res.should.redirectTo('/user/login');
                    res.should.have.status(302);
                    done();
                });
        });

        it('should not allow unauthorised access to staff-only tools', done => {
            agent
                .post('/user/login')
                .send({
                    _csrf: csrfToken,
                    username: 'test@test.com',
                    password: 'wrong'
                })
                .end((postErr, postRes) => {
                    postRes.text.should.match(/(.*)Your username and password combination is invalid(.*)/);
                    return agent
                        .get('/tools/survey-results')
                        .redirects(0)
                        .end((err, res) => {
                            res.should.have.status(302);
                            done();
                        });
                });
        });

        it('should allow authorised access to staff-only tools', done => {
            agent
                .post('/user/login')
                .send({
                    _csrf: csrfToken,
                    username: validUser.username,
                    password: validUser.password,
                    redirectUrl: '/tools/survey-results'
                })
                .redirects(0)
                .end((postErr, postRes) => {
                    postRes.should.have.status(302);
                    postRes.should.redirectTo('/tools/survey-results');
                    return agent.get('/tools/survey-results/').end((err, res) => {
                        res.should.have.status(200);
                        done();
                    });
                });
        });
    });
});
