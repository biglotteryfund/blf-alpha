'use strict';

const chai = require('chai');
const config = require('config');

chai.use(require('chai-http'));
const expect = chai.expect;

const helper = require('../helper');

describe('Core sections and features', () => {
    let server;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => helper.after(server));

    it('should allow contrast preferences to be set', () => {
        let redirectUrl = 'http://www.google.com';
        return chai
            .request(server)
            .get('/contrast/high')
            .query({
                url: redirectUrl
            })
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.cookie(config.get('cookies.contrast'));
                expect(res).to.redirectTo(redirectUrl);
                expect(res).to.have.status(302);
            });
    });

    it('should redirect search queries to a google site search', () => {
        return chai
            .request(server)
            .get('/search')
            .query({
                q: 'This is my search query'
            })
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(302);
                expect(res).to.redirectTo(
                    'https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+This%20is%20my%20search%20query'
                );
            });
    });

    it('should redirect legacy site search queries to google site search', () => {
        return chai
            .request(server)
            .get('/search?lang=en-GB&amp;q=something&amp;type=All&amp;order=r')
            .redirects(0)
            .catch(err => err.response)
            .then(res => {
                expect(res).to.have.status(302);
                expect(res).to.redirectTo('https://www.google.co.uk/search?q=site%3Abiglotteryfund.org.uk+something');
            });
    });
});
