/* eslint-env jest */
'use strict';
const httpMocks = require('node-mocks-http');
const { validationResult } = require('express-validator/check');

const { VALIDATORS } = require('../form-model');

describe('form validators', () => {
    function requestWithBody(body) {
        const req = httpMocks.createRequest({
            method: 'POST',
            body: body
        });

        req.i18n = {
            getLocale() {
                return 'en';
            }
        };

        return req;
    }

    describe('required', () => {
        const validatorFn = VALIDATORS.required({ en: 'Value must be provided', cy: '' })({
            name: 'example'
        });

        test('required field missing', done => {
            const reqA = requestWithBody({});
            validatorFn(reqA, httpMocks.createResponse(), () => {
                const errors = validationResult(reqA).mapped();
                expect(errors.example.msg).toBe('Value must be provided');
                done();
            });
        });

        test('required field present', done => {
            const req = requestWithBody({
                example: 'something'
            });
            validatorFn(req, httpMocks.createResponse(), () => {
                const errors = validationResult(req).array();
                expect(errors.length).toBe(0);
                done();
            });
        });
    });

    describe('email', () => {
        const validatorFn = VALIDATORS.email({
            name: 'email'
        });

        test('invalid email', done => {
            const reqA = requestWithBody({});
            validatorFn(reqA, httpMocks.createResponse(), () => {
                const errors = validationResult(reqA).mapped();
                expect(errors.email.msg).toBe('Please provide a valid email address');
                done();
            });
        });

        test('email present', done => {
            const req = requestWithBody({
                email: 'example@example.com'
            });
            validatorFn(req, httpMocks.createResponse(), () => {
                const errors = validationResult(req).array();
                expect(errors.length).toBe(0);
                done();
            });
        });
    });
});
