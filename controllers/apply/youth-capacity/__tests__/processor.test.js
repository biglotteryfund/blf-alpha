/* eslint-env jest */
'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const nodemailer = require('nodemailer');
const { get } = require('lodash');

const { processor, formatDataForStorage } = require('../processor');
const form = require('../form-model');
const { flattenFormData, stepsWithValues } = require('../../helpers');

const langData = fs.readFileSync(path.resolve(__dirname, '../../../../config/locales/en.yml'), 'utf-8');
const enCopy = yaml.safeLoad(langData);
const formCopy = get(enCopy, form.lang);

const mockFormData = {
    'step-1': { 'current-work': 'Test' },
    'step-2': { location: 'Barking and Dagenham', money: 'Test' },
    'step-3': { 'project-aims': 'Develop partnerships', 'people-and-communities': 'Test' },
    'step-4': {
        'organisation-name': 'Test organisation',
        'contact-name': 'Example',
        'contact-email': 'example@example.com',
        'contact-phone': '3454102030'
    }
};

describe('formatDataForStorage', () => {
    it('should format data for storage', () => {
        const stepsData = stepsWithValues(form.steps, mockFormData);
        const result = formatDataForStorage(stepsData, formCopy);
        expect(result).toMatchSnapshot();
    });
});

function cleanMailForSnaphot(info) {
    info.message = info.message
        .toString()
        .replace(/Message-ID: .*\n/, '')
        .replace(/Date: .*\n/, '')
        .replace(/ boundary=.*\n/, '')
        .replace(/----.*\n/gm, '');
    return info;
}

describe('processor', () => {
    it('should create success emails', async () => {
        const mockTransport = nodemailer.createTransport({
            streamTransport: true,
            newline: 'unix',
            buffer: true
        });

        const results = await processor({
            formModel: form,
            data: flattenFormData(mockFormData),
            copy: get(enCopy, form.lang),
            stepsWithValues: stepsWithValues(form.steps, mockFormData),
            mailTransport: mockTransport,
            storeApplication: false
        });

        const [customerEmail, internalEmail] = results.map(cleanMailForSnaphot);

        expect(customerEmail.message).toMatchSnapshot();
        expect(internalEmail.message).toMatchSnapshot();
    });
});
