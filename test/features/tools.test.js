'use strict';
/* global describe, it, beforeEach, afterEach, after */
const chai = require('chai');
chai.use(require('chai-http'));
chai.should();
const config = require('config');

const helper = require('./helper');
const models = require('../../models/index');

describe('authorisation for tools', () => {
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
        helper.after();
    });

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
            .redirects(0)
            .end((err, res) => {
                res.should.have.cookie(config.get('cookies.session'));
                res.should.redirectTo('/user/login');
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
            username: 'test@test.com',
            password: 'test',
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

describe('news editor tool', () => {
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

    // delete test data afterwards
    after(done => {
        console.log('Deleting test news data');
        models.News.destroy({
            where: {}
        });
        done();
    });

    afterEach(() => {
        helper.after();
    });

    it('should allow authorised staff to post valid news', done => {
        const loginData = {
            username: 'test@test.com',
            password: 'test',
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
