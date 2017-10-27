'use strict';
/* global describe, it, beforeEach, afterEach, after */
const chai = require('chai');
chai.use(require('chai-http'));
chai.should();

const helper = require('./helper');
const models = require('../../models/index');

describe('User authentication', () => {
    let agent, server;

    // before(done => {
    //     // create our valid test user
    //     models.Users
    //         .create({
    //             username: 'test@fakewebsite.com',
    //             password: 'hunter2',
    //             level: 10
    //         })
    //         .then(newUser => {
    //             console.log(newUser);
    //             done();
    //         });
    // });

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
        helper.after();
    });

    /* tests to write
    *
    * register:
    *   invalid details
    *   valid details
    *   email is sent (JSON return token?)
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

    it('should prevent invalid registrations', done => {
        const formData = {
            username: 'not_an_email_address',
            password: 'wrong'
        };

        agent
            .post('/user/register')
            .send(formData)
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo('/user/register');
                res.should.have.status(302);
                done();
            });
    });
});
