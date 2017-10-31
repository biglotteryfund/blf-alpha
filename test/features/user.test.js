'use strict';
/* global describe, it, beforeEach, afterEach, after */
const chai = require('chai');
chai.use(require('chai-http'));
chai.should();

const helper = require('./helper');

const validUser = {
    username: 'test@fakewebsite.com',
    password: 'hunter2',
    level: 10
};

describe('User authentication', () => {
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
        helper.after(server);
        done();
    });

    // delete test users afterward
    afterEach(done => {
        helper
            .truncateUsers()
            .then(() => {
                done();
            })
            .catch(() => {
                done(new Error('Error deleting users'));
            });
    });

    beforeEach(() => {
        agent = chai.request.agent(server);
    });

    // REGISTRATION

    it('should prevent registrations from invalid email address', done => {
        const formData = {
            username: 'not_an_email_address',
            password: 'wrong'
        };
        agent
            .post('/user/register')
            .send(formData)
            .end((err, res) => {
                res.text.should.match(/(.*)Please provide a valid email address(.*)/);
                done();
            });
    });

    it('should prevent registrations with invalid passwords', done => {
        const formData = {
            username: 'bill@microsoft.com',
            password: 'clippy'
        };
        agent
            .post('/user/register')
            .send(formData)
            .end((err, res) => {
                res.text.should.match(/(.*)Please provide a password that contains at least one number(.*)/);
                done();
            });
    });

    it('should allow valid registrations', done => {
        const formData = {
            username: 'email@website.com',
            password: 'password1',
            redirectUrl: '/some-magic-endpoint'
        };
        agent
            .post('/user/register')
            .send(formData)
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(302);
                res.should.redirectTo(formData.redirectUrl);
                done();
            });
    });

    it('should email valid users with a token', done => {
        const formData = {
            username: 'email@website.com',
            password: 'password1',
            redirectUrl: '/some-magic-endpoint',
            returnToken: true
        };
        agent
            .post('/user/register')
            .send(formData)
            .end((err, res) => {
                // @TODO make this regex match
                res.body.token.should.match(/(\w*)\.(\w*)\.(\w*)/);
                res.body.email.to.should.equal(formData.username);
                res.body.email.subject.should.equal('Activate your Big Lottery Fund website account');
                done();
            });
    });

    // ACTIVATION

    /*
    *  activate:
    *    already-active users won't be re-sent emails
    *    invalid tokens rejected
    *    valid tokens accepted
    *    tokens expire (how to test?)
    *    tokens can't be re-used
     */

    it('should allow valid user activation', done => {
        const formData = {
            username: 'email@website.com',
            password: 'password1'
        };
        agent
            .post('/user/register')
            .send(formData)
            .end((err, res) => {
                let token = res.body.token;
                // now activate the user
                console.log(res.text);
                done();
                // agent.get(`/user/activate?token=${token}`)
                //     .end((err, res) => {
                //         // @TODO this redirects them login as we don't enforce that
                //         res.text.should.match(/(.*)Please provide a password that contains at least one number(.*)/);
                //         done();
                //     });
            });
    });

    // LOGIN

    it('should allow users to login', done => {
        const formData = {
            username: 'someone@somewhere.com',
            password: 'dfs32d3fddf!!!'
        };
        agent
            .post('/user/register')
            .send(formData)
            .redirects(0)
            .end((err, res) => {
                res.should.have.status(302);

                // now log them in
                let loginFormData = formData;
                loginFormData.redirectUrl = '/secret-stuff';
                agent
                    .post('/user/login')
                    .send(loginFormData)
                    .redirects(0)
                    .end((err, res) => {
                        res.should.have.status(302);
                        res.should.redirectTo(loginFormData.redirectUrl);

                        // now try to access something private
                        agent.get('/user/dashboard').end((err, res) => {
                            res.text.should.match(/(.*)Logged in as(.*)/);
                            done();
                        });
                    });
            });
    });

    it('should not allow unknown users to login', done => {
        const formData = {
            username: 'fake@site.com',
            password: 'myp455w0rd'
        };
        agent
            .post('/user/login')
            .send(formData)
            .end((err, res) => {
                res.text.should.match(/(.*)Your username and password combination is invalid(.*)/);
                done();
            });
    });

    // PASSWORD RESET

    /* password reset
    *     valid account sends email (JSON?)
    *     invalid tokens rejected
    *     valid tokens accepted
    *     tokens expire (how to test?)
    *     tokens can't be re-used
    *
    * */
});
