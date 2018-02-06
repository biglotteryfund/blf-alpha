'use strict';
const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('../helper');

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

    let csrfToken;
    beforeEach(async () => {
        agent = chai.request.agent(server);
        csrfToken = await helper.getCsrfToken(agent, '/user/login');
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

    it('should prevent registrations from invalid email address', () => {
        return agent
            .post('/user/register')
            .send({
                _csrf: csrfToken,
                username: 'not_an_email_address',
                password: 'wrong'
            })
            .then(res => {
                expect(res.text).to.match(/(.*)Please provide a valid email address(.*)/);
            });
    });

    it('should prevent registrations with invalid passwords', () => {
        return agent
            .post('/user/register')
            .send({
                _csrf: csrfToken,
                username: 'bill@microsoft.com',
                password: 'clippy'
            })
            .then(res => {
                expect(res.text).to.match(/(.*)Please provide a password that contains at least one number(.*)/);
            });
    });

    it('should allow valid registrations', () => {
        const formData = {
            _csrf: csrfToken,
            username: 'email@website.com',
            password: 'password1',
            redirectUrl: '/some-magic-endpoint'
        };

        return agent
            .post('/user/register')
            .send(formData)
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(302);
                expect(res).to.redirectTo(formData.redirectUrl);
            });
    });

    it('should email valid users with a token', () => {
        const formData = {
            _csrf: csrfToken,
            username: 'email@website.com',
            password: 'password1',
            redirectUrl: '/some-magic-endpoint',
            returnToken: true
        };

        return agent
            .post('/user/register')
            .send(formData)
            .then(res => {
                // via https://github.com/auth0/node-jsonwebtoken/issues/162
                expect(res.body.token).to.match(/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/);
                expect(res.body.email.sendTo).to.equal(formData.username);
                expect(res.body.email.subject).to.equal('Activate your Big Lottery Fund website account');
            });
    });

    it('should allow users to login', () => {
        const formData = {
            _csrf: csrfToken,
            username: 'someone@somewhere.com',
            password: 'dfs32d3fddf!!!'
        };

        return agent
            .post('/user/register')
            .send(formData)
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(302);

                // now log them in
                let loginFormData = formData;
                loginFormData.redirectUrl = '/secret-stuff';
                return agent
                    .post('/user/login')
                    .send(loginFormData)
                    .redirects(0)
                    .catch(err => err.response)
                    .then(loginRes => {
                        expect(loginRes).to.have.status(302);
                        expect(loginRes).to.redirectTo(loginFormData.redirectUrl);

                        // now try to access something private
                        return agent.get('/user/dashboard').then(dashboardRes => {
                            expect(dashboardRes.text).to.match(/(.*)Logged in as(.*)/);
                        });
                    });
            });
    });

    it('should not allow unknown users to login', () => {
        agent
            .post('/user/login')
            .send({
                _csrf: csrfToken,
                username: 'fake@site.com',
                password: 'myp455w0rd'
            })
            .then(res => {
                expect(res.text).to.match(/(.*)Your username and password combination is invalid(.*)/);
            });
    });
});
