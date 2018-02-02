'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const { JSDOM } = require('jsdom');
const helper = require('../helper');

describe('Main sections', () => {
    let server;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => helper.after(server));

    function basicRequest(urlPath) {
        return chai.request(server).get(urlPath);
    }

    it('should serve top-level pages', () => {
        return Promise.all([
            basicRequest('/'),
            basicRequest('/funding'),
            basicRequest('/research'),
            basicRequest('/over10k'),
            basicRequest('/under10k')
        ]).then(results => {
            results.forEach(res => {
                expect(res.status).to.equal(200);
            });
        });
    });

    it('should serve a list of programmes', () => {
        return chai
            .request(server)
            .get('/funding/programmes')
            .then(res => {
                const { document } = new JSDOM(res.text).window;
                const programmes = document.querySelectorAll('.qa-programme-card');
                expect(programmes.length).to.be.at.least(2);
            });
    });
});
