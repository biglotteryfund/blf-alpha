/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const searchHandler = require('./search');

test('redirect search queries to a google site search', () => {
    const req = httpMocks.createRequest({
        method: 'GET',
        url: '/search?q=This is my search query',
    });
    const res = httpMocks.createResponse();
    searchHandler(req, res);
    expect(res._getRedirectUrl()).toBe(
        'https://www.google.co.uk/search?q=site%3Awww.tnlcommunityfund.org.uk+This%20is%20my%20search%20query'
    );
});
