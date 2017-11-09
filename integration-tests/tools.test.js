'use strict';
/* global describe, it, before, beforeEach, afterEach, after */
const chai = require('chai');
chai.use(require('chai-http'));
chai.should();
const config = require('config');
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
        it('should block access to staff-only tools', done => {
            agent
                .get('/tools/locales/')
                .redirects(0)
                .end((err, res) => {
                    res.should.redirectTo('/user/login');
                    res.should.have.status(302);
                    done();
                });
        });

        it('should not allow unauthorised access to staff-only tools', done => {
            const formData = {
                username: 'test@test.com',
                password: 'wrong'
            };

            agent
                .post('/user/login')
                .send(formData)
                .end((err, res) => {
                    res.should.have.cookie(config.get('cookies.session'));
                    res.text.should.match(/(.*)Your username and password combination is invalid(.*)/);
                    return agent
                        .get('/tools/locales/')
                        .redirects(0)
                        .end((err, res) => {
                            res.should.have.status(302);
                            done();
                        });
                });
        });

        it('should allow authorised access to staff-only tools', done => {
            const formData = {
                username: validUser.username,
                password: validUser.password,
                redirectUrl: '/tools/locales/'
            };

            agent
                .post('/user/login')
                .send(formData)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.cookie(config.get('cookies.session'));
                    res.should.have.status(302);
                    res.should.redirectTo('/tools/locales/');
                    return agent.get('/tools/locales/').end((err, res) => {
                        res.should.have.status(200);
                        done();
                    });
                });
        });
    });

});
