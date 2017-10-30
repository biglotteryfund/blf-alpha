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

// create a valid test user
before(done => {
    helper.createTestUser(validUser).then(() => {
        console.log('Created a user');
        done();
    }).catch(err => {
        done(new Error('Error creating user'));
    });
});

// delete test users afterward
after(done =>  {
    helper.truncateUsers().then(() => {
        console.log('Deleted test users');
        done();
    }).catch(err => {
        done(new Error('Error deleting users'));
    });
});

describe('User authentication', () => {
    let agent, server;

    beforeEach(done => {
        server = helper.before();

        // grab a valid CSRF token
        agent = chai.request.agent(server);
        done();
        // agent.get('/home')
        //     .end((err, res) => {
        //         const dom = new JSDOM(res.text);
        //         csrfToken = dom.window.document.querySelector('input[name=_csrf]').value;
        //         done();
        //     });
    });

    afterEach(() => {
        return helper.after();
    });

    /* tests to write
    *
    *
    *  activate:
    *    already-active users won't be re-sent emails
    *    invalid tokens rejected
    *    valid tokens accepted
    *    tokens expire (how to test?)
    *    tokens can't be re-used
    *
    *   login:
    *     invalid account blocked
    *     valid accounts allowed in
    *
    *   password reset:
    *     valid account sends email (JSON?)
    *     invalid tokens rejected
    *     valid tokens accepted
    *     tokens expire (how to test?)
    *     tokens can't be re-used
    *
    * */

    /*
    * register:
    *   invalid details
    *   valid details
    *   email is sent (JSON return token?)
    *   */

    it('should prevent invalid registrations', done => {
        const formData = {
            username: 'not_an_email_address',
            password: 'wrong'
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
                res.should.redirectTo('/some-magic-endpoint');
                res.should.have.status(302);
                done();
            });
    });

});
