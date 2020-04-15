/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const welshRedirectHandler = require('./welsh-redirect');

test('strip welsh prefix from url and redirect', function () {
    const req = httpMocks.createRequest({
        method: 'GET',
        url: '/welsh/some/page',
    });
    const res = httpMocks.createResponse();
    welshRedirectHandler(req, res, () => {});
    expect(res._getStatusCode()).toBe(302);
    expect(res._getRedirectUrl()).toBe('/some/page');
});

test('no redirect if no welsh prefix', function () {
    const req = httpMocks.createRequest({
        method: 'GET',
        url: '/some/page',
    });
    const res = httpMocks.createResponse();
    welshRedirectHandler(req, res, () => {});
    expect(res._getStatusCode()).toBe(200);
});
