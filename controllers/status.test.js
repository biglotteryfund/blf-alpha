/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const statusHandler = require('./status');

test('should render status endpoint', () => {
    const req = httpMocks.createRequest({
        method: 'GET',
        url: '/robots.txt',
    });

    const res = httpMocks.createResponse();

    statusHandler(req, res);

    expect(res._isJSON()).toBeTruthy();
    const data = JSON.parse(res._getData());
    expect(data).toMatchObject({
        APP_ENV: 'test',
        BUILD_NUMBER: 'DEV',
        DEPLOY_ID: 'DEV',
        COMMIT_ID: 'DEV',
        START_DATE: expect.any(String),
        UPTIME: 'a few seconds',
    });
});
