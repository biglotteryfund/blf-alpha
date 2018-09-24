/* eslint-env jest */
'use strict';
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const yaml = require('js-yaml');
const { get } = require('lodash');

// Mock email secret
process.env.DIGITAL_FUNDING_EMAIL = 'digital@example.com';

const processor = require('../processor');
const formModel = require('../form-model');
const { flattenFormData, stepsWithValues } = require('../../helpers');

const langData = fs.readFileSync(path.resolve(__dirname, '../../../../config/locales/en.yml'), 'utf-8');
const enCopy = yaml.safeLoad(langData);

const mockFormData = {
    'step-1': {
        name: 'Example Person',
        email: 'example@example.com',
        'organisation-name': 'Test Organisation',
        'about-your-organisation': 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro, inventore.'
    }
};

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

        const form = formModel(1);
        const results = await processor({
            form: form,
            data: flattenFormData(mockFormData),
            stepsWithValues: stepsWithValues(form.steps, mockFormData),
            mailTransport: mockTransport,
            copy: get(enCopy, form.lang)
        });

        const [customerEmail] = results.map(cleanMailForSnaphot);
        expect(customerEmail.message).toMatchSnapshot();
    });
});
