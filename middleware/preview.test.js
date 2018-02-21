/* eslint-env mocha */
const chai = require('chai');
const expect = chai.expect;
const httpMocks = require('node-mocks-http');

const TEST_PREVIEW_DOMAIN = 'test.foo.com';
process.env.PREVIEW_DOMAIN = TEST_PREVIEW_DOMAIN;
const preview = require('./preview');

describe('preview middleware', () => {
    it('should store preview data in a local variable on valid preview endpoints', () => {
        const req = httpMocks.createRequest({
            headers: {
                Host: TEST_PREVIEW_DOMAIN
            },
            query: {
                draft: 42
            }
        });
        const res = httpMocks.createResponse();
        preview(req, res, () => {});
        expect(res.locals.PREVIEW_MODE.mode).to.equal('draft');
        expect(res.locals.PREVIEW_MODE.id).to.equal(42);
    });

    it('should not add preview data to non-preview hosts', () => {
        const req = httpMocks.createRequest({
            headers: {
                Host: 'some.other.host'
            },
            query: {
                draft: 42
            }
        });
        const res = httpMocks.createResponse();
        preview(req, res, () => {});
        expect(res.locals.PREVIEW_MODE).to.be.undefined;
    });
});
