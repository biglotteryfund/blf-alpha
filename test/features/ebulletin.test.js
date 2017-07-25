'use strict';
/* global describe, it, beforeEach, afterEach */
const chai = require('chai');
chai.use(require('chai-http'));
const should = chai.should();
const jsdom = require("jsdom");
const {JSDOM} = jsdom;
const config = require("config");

const helper = require('../helper');

describe("e-bulletin signups", () => {

    let agent, csrfToken, server;

    beforeEach((done) => {
        server = helper.before();

        // grab a valid CSRF token
        agent = chai.request.agent(server);
        agent.get('/home')
            .end((err, res) => {
                const dom = new JSDOM(res.text);
                csrfToken = dom.window.document.querySelector('input[name=_csrf]').value;
                done();
            });
    });

    afterEach(() => {
        helper.after();
    });

    it('should allow signing up to the e-bulletin', (done) => {

        agent.post('/ebulletin')
            .send({
                '_csrf': csrfToken,
                'cd_FIRSTNAME': 'Test',
                'cd_LASTNAME': 'Test',
                'Email': 'test@test.com',
                'cd_ORGANISATION': 'Test',
                'location': 'cd_WALES_MAIL'
            })
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo('/#' + config.get('anchors.ebulletin'));
                res.should.have.status(302);
                done();
            });
    });

    it('should fail signups to the e-bulletin with missing data', (done) => {

        agent.post('/ebulletin')
            .send({
                '_csrf': csrfToken,
                'cd_ORGANISATION': 'Test'
            })
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo('/#' + config.get('anchors.ebulletin'));
                res.should.have.status(302);
                done();
            });
    });

});