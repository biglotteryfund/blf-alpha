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
                    console.log('Created a user');
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
                .get('/tools/edit-news')
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
                        .get('/tools/edit-news/')
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
                redirectUrl: '/tools/edit-news/'
            };

            agent
                .post('/user/login')
                .send(formData)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.cookie(config.get('cookies.session'));
                    res.should.have.status(302);
                    res.should.redirectTo('/tools/edit-news/');
                    return agent.get('/tools/edit-news/').end((err, res) => {
                        res.should.have.status(200);
                        done();
                    });
                });
        });
    });

    describe('News editor tool', () => {
        it('should allow authorised staff to post valid news', done => {
            const loginData = {
                username: validUser.username,
                password: validUser.password,
                redirectUrl: '/tools/edit-news/'
            };

            // invalid news
            agent
                .post('/user/login')
                .send(loginData)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.cookie(config.get('cookies.session'));
                    res.should.have.status(302);
                    res.should.redirectTo('/tools/edit-news/');
                    return agent
                        .post('/tools/edit-news/')
                        .send({
                            title: 'Broken title',
                            text: 'Broken text'
                        })
                        .redirects(0)
                        .end((err, res) => {
                            res.should.have.status(302);
                            res.should.redirectTo('/tools/edit-news/?error');
                        });
                });

            // valid news
            agent
                .post('/user/login')
                .send(loginData)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.cookie(config.get('cookies.session'));
                    res.should.have.status(302);
                    res.should.redirectTo('/tools/edit-news/');
                    return agent
                        .post('/tools/edit-news/')
                        .send({
                            title_en: 'Test title (english)',
                            title_cy: 'Test title (welsh)',
                            text_en: 'Test text (english)',
                            text_cy: 'Test text (welsh)',
                            link_en: 'Test link (english)',
                            link_cy: 'Test link (welsh)'
                        })
                        .redirects(0)
                        .end((err, res) => {
                            res.should.have.status(302);
                            res.should.redirectTo('/tools/edit-news/?success');
                            done();
                        });
                });
        });
    });
});
