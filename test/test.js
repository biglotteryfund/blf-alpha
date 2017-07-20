'use strict';
/* global describe, it, beforeEach, afterEach, after */
const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();

const config = require("config");
const jsdom = require("jsdom");
const {JSDOM} = jsdom;

// use the test database
process.env.CUSTOM_DB = config.get('database-test');

const routes = require('../routes/routes');
const models = require('../models/index');

chai.use(chaiHttp);

let captureStream = (stream) => {
    let oldWrite = stream.write;
    let buf = '';
    stream.write = function (chunk, encoding, callback) {
        buf += chunk.toString(); // chunk is a String or Buffer
        oldWrite.apply(stream, arguments);
    };

    return {
        unhook: () => {
            stream.write = oldWrite;
        },
        captured: () => {
            return buf;
        }
    };
};

describe('Express application', function () {
    this.timeout(20000);
    let server, hook;
    const assets = require('../modules/assets');
    const CSS_PATH = assets.getCachebustedPath('stylesheets/style.css');

    beforeEach(() => {
        process.env.PORT = 8090;
        server = require('../bin/www');
        hook = captureStream(process.stdout);
    });

    afterEach(() => {
        server.close();
        hook.unhook();
    });

    it('responds to /', (done) => {
        chai.request(server)
            .get('/')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('serves the new homepage', (done) => {
        chai.request(server)
            .get('/home')
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    });

    it('serves the legacy homepage', (done) => {
        chai.request(server)
            .get('/legacy')
            .end((err, res) => {
                // verify the page is coming from a microsoft stack
                res.should.have.header('X-Powered-By', /^ASP\.NET/);
                res.should.have.header('X-AspNet-Version');
                res.should.have.status(200);
                done();
            });
    });

    describe("e-bulletin signups", () => {

        let agent;
        let csrfToken;

        beforeEach((done) => {
            // grab a valid CSRF token
            agent = chai.request.agent(server);
            agent.get('/home')
                .end((err, res) => {
                    const dom = new JSDOM(res.text);
                    csrfToken = dom.window.document.querySelector('input[name=_csrf]').value;
                    done();
                });
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


    it('serves static files', (done) => {
        chai.request(server)
            .get(CSS_PATH)
            .end((err, res) => {
                res.should.have.status(200);
                res.should.have.header('content-type', /^text\/css/);
                done();
            });
    });

    it('returns grant data for postcodes', (done) => {
        let validPostcode = 'B14 7EW';
        chai.request(server)
            .get('/lookup')
            .query({
                postcode: validPostcode
            })
            .end((err, res) => {
                res.should.have.status(200);
                done();
            });
    }).timeout(3000);

    it('redirects to homepage for invalid postcodes', (done) => {
        let invalidPostcode = 'ABC 123';
        chai.request(server)
            .get('/lookup')
            .query({
                postcode: invalidPostcode
            })
            .redirects(0)
            .end((err, res) => {
                res.should.redirectTo('/');
                res.should.have.status(302);
                done();
            });
    }).timeout(3000);

    it('404s everything else', (done) => {
        chai.request(server)
            .get('/foo/bar')
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });

    // test the order form specifically
    describe("Material order form", () => {

        let agent;
        let csrfToken;

        beforeEach((done) => {
            // grab a valid CSRF token
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;
            agent = chai.request.agent(server);
            agent.get(path)
                .end((err, res) => {
                    // res.should.have.cookie('_csrf');
                    const dom = new JSDOM(res.text);
                    csrfToken = dom.window.document.querySelector('input[name=_csrf]').value;
                    done();
                });
        });

        it('should serve materials to order', (done) => {
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;
            chai.request(server)
                .get(path)
                .end((err, res) => {
                    res.should.have.status(200);
                    done();
                });
        });

        it('should allow adding a product to an order via AJAX', (done) => {
            const itemId = 1;
            const itemCode = 'BIG-PLAQAS';
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            agent.post(path + '/item/' + itemId)
                .set('Accept', 'application/json')
                .send({
                    '_csrf': csrfToken,
                    'code': itemCode,
                    'action': 'increase'
                })
                .end((err, res) => {
                    res.should.have.status(200);
                    res.should.have.header('content-type', /^application\/json/);
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    res.body.should.have.property('quantity');
                    res.body.quantity.should.equal(1);
                    done();
                });
        });

        it('should allow incrementing a product in an order via AJAX', (done) => {
            const itemId = 1;
            const itemCode = 'BIG-PLAQAS';
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            const formData = {
                '_csrf': csrfToken,
                'code': itemCode,
                'action': 'increase'
            };

            // add the first item
            agent.post(path + '/item/' + itemId)
                .set('Accept', 'application/json')
                .send(formData)
                .end((err, res) => {
                    // add the second item
                    agent.post(path + '/item/' + itemId)
                        .set('Accept', 'application/json')
                        .send(formData)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.should.have.header('content-type', /^application\/json/);
                            res.body.should.have.property('status');
                            res.body.status.should.equal('success');
                            res.body.should.have.property('quantity');
                            res.body.quantity.should.equal(2);
                            done();
                        });
                });

        });

        it('should allow decrementing a product in an order via AJAX', (done) => {
            const itemId = 1;
            const itemCode = 'BIG-PLAQAS';
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            const formData = {
                '_csrf': csrfToken,
                'code': itemCode,
                'action': 'increase'
            };

            // add the first item
            agent.post(path + '/item/' + itemId)
                .set('Accept', 'application/json')
                .send(formData)
                .end((err, res) => {

                    // check it was added
                    res.should.have.status(200);
                    res.should.have.header('content-type', /^application\/json/);
                    res.body.should.have.property('status');
                    res.body.status.should.equal('success');
                    res.body.should.have.property('quantity');
                    res.body.quantity.should.equal(1);

                    // now remove the first item
                    formData.action = 'decrease';
                    agent.post(path + '/item/' + itemId)
                        .set('Accept', 'application/json')
                        .send(formData)
                        .end((err, res) => {
                            res.should.have.status(200);
                            res.should.have.header('content-type', /^application\/json/);
                            res.body.should.have.property('status');
                            res.body.status.should.equal('success');
                            res.body.should.have.property('quantity');
                            res.body.quantity.should.equal(0);
                            done();
                        });
                });
        });

        it('should allow ordering with personal details', (done) => {
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            const formData = {
                '_csrf': csrfToken,
                'skipEmail': true,
                'yourName': 'Little Bobby Tables',
                'yourEmail': 'bobby@xkcd.com',
                'yourNumber': '123456789',
                'yourAddress1': '123 Fake Street',
                'yourAddress2': 'Notrealsville',
                'yourTown': 'Madeuptown',
                'yourCounty': 'Nonexistentland',
                'yourPostcode': 'NW1 6XE',
                'yourProjectName': 'White Hat Testing',
                'yourProjectID': '666',
                'yourGrantAmount': '£2038'
            };

            agent.post(path)
                .send(formData)
                .redirects(0)
                .end((err, res) => {
                    res.body.should.have.property('yourEmail');
                    res.body.yourEmail.should.equal('bobby@xkcd.com');
                    done();
                });
        });

        it('should block ordering with missing personal details', (done) => {
            const funding = routes.sections.funding;
            const path = funding.path + funding.pages.freeMaterials.path;

            const formData = {
                '_csrf': csrfToken,
                'skipEmail': true,
                'yourName': 'Little Bobby Tables'
            };

            agent.post(path)
                .send(formData)
                .redirects(0)
                .end((err, res) => {
                    res.should.redirectTo('/funding/funding-guidance/managing-your-funding/ordering-free-materials#your-details');
                    res.should.have.status(302);
                    done();
                });
        });
    });

    describe("authorisation for tools", () => {

        let agent;
        let csrfToken;

        beforeEach((done) => {
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

        it('should block access to staff-only tools', (done) => {
            agent.get('/tools/edit-news')
                .redirects(0)
                .end((err, res) => {
                    res.should.redirectTo('/tools/login');
                    res.should.have.status(302);
                    done();
                });
        });

        it('should not allow unauthorised access to staff-only tools', (done) => {

            const formData = {
                username: 'test',
                password: 'wrong'
            };

            agent.post('/tools/login')
                .send(formData)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.cookie(config.get('cookies.session'));
                    res.should.redirectTo('/tools/login');
                    return agent.get('/tools/edit-news/')
                        .redirects(0)
                        .end((err, res) => {
                            res.should.have.status(302);
                            done();
                        });
                });

        });

        it('should allow authorised access to staff-only tools', (done) => {

            const formData = {
                username: 'test',
                password: 'test',
                redirectUrl: '/tools/edit-news/'
            };

            agent.post('/tools/login')
                .send(formData)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.cookie(config.get('cookies.session'));
                    res.should.have.status(302);
                    res.should.redirectTo('/tools/edit-news/');
                    return agent.get('/tools/edit-news/')
                        .end((err, res) => {
                            res.should.have.status(200);
                            done();
                        });
                });
        });

    });

    describe("news editor tool", () => {

        let agent;
        let csrfToken;

        // bit hacky - allows us to delete all test data
        // while preserving "real" test news (eg. by users on CMS)
        let testPostTitle = '$$$$TEST$$$$';

        beforeEach((done) => {
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
        after((done) => {
            console.log('Deleting test news data');
            models.News.destroy({
                where: {
                    title_en: testPostTitle
                },
            });
            done();
        });


        it('should allow authorised staff to post news', (done) => {

            const loginData = {
                username: 'test',
                password: 'test',
                redirectUrl: '/tools/edit-news/'
            };

            // invalid news
            agent.post('/tools/login')
                .send(loginData)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.cookie(config.get('cookies.session'));
                    res.should.have.status(302);
                    res.should.redirectTo('/tools/edit-news/');
                    return agent.post('/tools/edit-news/')
                        .send({
                            title: 'Broken title',
                            text: 'Broken text'
                        })
                        .redirects(0)
                        .end((err, res) => {
                            res.should.have.status(302);
                            res.should.redirectTo('/tools/edit-news/?error');
                            done();
                        });
                });

            // valid news
            agent.post('/tools/login')
                .send(loginData)
                .redirects(0)
                .end((err, res) => {
                    res.should.have.cookie(config.get('cookies.session'));
                    res.should.have.status(302);
                    res.should.redirectTo('/tools/edit-news/');
                    return agent.post('/tools/edit-news/')
                        .send({
                            title_en: testPostTitle,
                            title_cy: 'Test title (welsh)',
                            text_en: 'Test text (english)',
                            text_cy: 'Test text (welsh)',
                            link_en: 'Test link (english)',
                            link_cy: 'Test link (welsh)',
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

    /* tests to add
     *
     *  news UD works
     *  GA is loaded
     *  are form fields working as expected?
     *  contrast tool exists and sets cookies etc
     *  welsh URL serves welsh copy
     */
});