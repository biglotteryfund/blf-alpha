'use strict';

const chai = require('chai');
chai.use(require('chai-http'));
const expect = chai.expect;

const { exec } = require('child_process');
const helper = require('../helper');

function testUrl(path) {
    return `http://localhost:${process.env.PORT}${path}?cb=${Date.now()}`;
}

describe('Accessibility integration tests', () => {
    let server;

    before(done => {
        helper.before(serverInstance => {
            server = serverInstance;
            done();
        });
    });

    after(() => helper.after(server));

    it('should pass a11y smoke test @slow', done => {
        const url = testUrl('/funding/programmes');
        const cmd = `axe ${url} --disable color-contrast --exit --exclude iframe`;
        exec(cmd, (error, stdout) => {
            console.log(stdout);
            if (error) {
                expect(error).to.be.undefined;
            }
            done();
        });
    });
});
