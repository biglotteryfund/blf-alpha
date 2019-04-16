/* eslint-env jest */
'use strict';
const { formModel } = require('./form-model');
const { mockFullForm } = require('./mock-form');

describe('awards for all form model', () => {
    function validate(mock) {
        return formModel.schema.validate(mock, {
            abortEarly: false,
            stripUnknown: true
        });
    }

    test('invalid empty form', () => {
        const validationResult = validate({});
        expect(validationResult.error).toBeInstanceOf(Error);
    });

    test('validate full form', () => {
        const mock = mockFullForm({
            country: 'england',
            organisationType: 'unregistered-vco'
        });

        const validationResult = validate(mock);
        expect(validationResult.error).toBeNull();
    });

    test('validate full form with company number', () => {
        const mockWithoutCompanyNumber = mockFullForm({
            country: 'england',
            organisationType: 'not-for-profit-company'
        });

        expect(validate(mockWithoutCompanyNumber).error).toBeInstanceOf(Error);

        const mockWithCompanyNumber = mockFullForm({
            country: 'england',
            organisationType: 'not-for-profit-company',
            companyNumber: '123456789'
        });
        expect(validate(mockWithCompanyNumber).error).toBeNull();
    });

    test('validate full form with charity number', () => {
        const mockWithoutCharityNumber = mockFullForm({
            country: 'england',
            organisationType: 'not-for-profit-company'
        });

        expect(validate(mockWithoutCharityNumber).error).toBeInstanceOf(Error);

        const mockWithCharityNumber = mockFullForm({
            country: 'england',
            organisationType: 'unincorporated-registered-charity',
            charityNumber: '123456789'
        });

        expect(validate(mockWithCharityNumber).error).toBeNull();
    });
});
