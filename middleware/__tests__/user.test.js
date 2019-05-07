/* eslint-env jest */
'use strict';

const httpMocks = require('node-mocks-http');
const { addAlertMessage } = require('../user');

describe('addAlertMessage', () => {
    it('should add alert messages to requests', () => {
        const req = httpMocks.createRequest({
            url: '/user/login',
            query: {
                s: 'passwordUpdated'
            }
        });
        const res = httpMocks.createResponse();
        addAlertMessage(req, res, () => {});
        expect(res.locals.alertMessage).toContain('Your password was successfully updated!');
    });
});
