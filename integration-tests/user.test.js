'use strict';
const chai = require('chai');
chai.use(require('chai-http'));
chai.should();

const helper = require('./helper');

describe('User authentication', () => {
    let server, agent;

    // set up pre-test dependencies
    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(done => {
        helper.after(server);
        done();
    });

    beforeEach(() => {
        agent = chai.request.agent(server);
    });

    // delete test users after each test
    afterEach(done => {
        helper
            .truncateUsers()
            .then(() => {
                done();
            })
            .catch(() => {
                helper.after(server);
                done(new Error('Error deleting users'));
            });
    });

    describe('User registration', () => {
        let csrfToken;
        beforeEach(async () => {
            csrfToken = await helper.getCsrfToken(agent, '/user/login');
        });

        it('should prevent registrations from invalid email address', done => {
            const formData = {
                _csrf: csrfToken,
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
                _csrf: csrfToken,
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
                _csrf: csrfToken,
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
                _csrf: csrfToken,
                username: 'email@website.com',
                password: 'password1',
                redirectUrl: '/some-magic-endpoint',
                returnToken: true
            };
            agent
                .post('/user/register')
                .send(formData)
                .end((err, res) => {
                    // via https://github.com/auth0/node-jsonwebtoken/issues/162
                    res.body.token.should.match(/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/);
                    res.body.email.to.should.equal(formData.username);
                    res.body.email.subject.should.equal('Activate your Big Lottery Fund website account');
                    done();
                });
        });
    });

    describe('User login', () => {
        let csrfToken;
        beforeEach(async () => {
            csrfToken = await helper.getCsrfToken(agent, '/user/login');
        });

        it('should allow users to login', done => {
            const formData = {
                _csrf: csrfToken,
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
                _csrf: csrfToken,
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
    });
});
