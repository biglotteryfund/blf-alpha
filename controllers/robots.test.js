/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const robotsHandler = require('./robots');

function createRequestFor(host) {
    return httpMocks.createRequest({
        method: 'GET',
        url: '/robots.txt',
        headers: { 'Host': host, 'X-Forwarded-Proto': 'https' },
    });
}

test('should allow indexing on live domain', () => {
    const req = createRequestFor('www.tnlcommunityfund.org.uk');
    const res = httpMocks.createResponse();
    robotsHandler(req, res);
    expect(res._getData()).toMatchInlineSnapshot(`
        "user-agent: *
        sitemap: https://www.tnlcommunityfund.org.uk/sitemap.xml
        disallow: /about/newsletter/insights"
    `);
});

test('should block indexing on other domains', () => {
    const req = createRequestFor('apply.tnlcommunityfund.org.uk');
    const res = httpMocks.createResponse();
    robotsHandler(req, res);
    expect(res._getData()).toMatchInlineSnapshot(`
        "user-agent: *
        sitemap: https://apply.tnlcommunityfund.org.uk/sitemap.xml
        disallow: /about/newsletter/insights
        disallow: /"
    `);
});
