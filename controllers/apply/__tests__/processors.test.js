/* eslint-env jest */
'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const nodemailer = require('nodemailer');
const { get } = require('lodash');

const { flattenFormData, stepsWithValues } = require('../helpers');
const langData = fs.readFileSync(path.resolve(__dirname, '../../../config/locales/en.yml'), 'utf-8');
const enCopy = yaml.safeLoad(langData);

function cleanMailForSnaphot(info) {
    info.message = info.message
        .toString()
        .replace(/Message-ID: .*\n/, '')
        .replace(/Date: .*\n/, '')
        .replace(/ boundary=.*\n/, '')
        .replace(/----.*\n/gm, '');
    return info;
}

const mockTransport = nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true
});

describe('Reaching communities', () => {
    const form = require('../reaching-communities/form-model');
    const formCopy = get(enCopy, form.lang);
    const processor = require('../reaching-communities/processor');

    const mockFormData = {
        'step-1': {
            'your-idea': 'Test idea'
        },
        'step-2': {
            location: 'South West',
            'project-location': 'London'
        },
        'step-3': {
            'organisation-name': 'Test Organisation',
            'additional-organisations': ''
        },
        'step-4': {
            'first-name': 'Example',
            'last-name': 'Person',
            email: 'example@example.com',
            'phone-number': '03454102030'
        }
    };

    it('should create success emails', async () => {
        const results = await processor(
            {
                data: flattenFormData(mockFormData),
                copy: formCopy,
                stepsWithValues: stepsWithValues(form.steps, mockFormData)
            },
            mockTransport
        );

        const [customerEmail, internalEmail] = results.map(cleanMailForSnaphot);

        expect(customerEmail.message).toMatchSnapshot();
        expect(internalEmail.message).toMatchSnapshot();
    });
});

describe('Digital fund', () => {
    const form = require('../digital-fund/form-model').strand1;
    const formCopy = get(enCopy, form.lang);
    const processor = require('../digital-fund/processor');

    const mockFormData = {
        'step-1': {
            name: 'Example Person',
            email: 'example@example.com',
            'organisation-name': 'Test Organisation',
            'about-your-organisation': 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro, inventore.'
        }
    };

    it('should create success emails', async () => {
        const results = await processor(
            {
                form: form,
                locale: 'en',
                data: flattenFormData(mockFormData),
                stepsWithValues: stepsWithValues(form.steps, mockFormData),
                copy: formCopy
            },
            mockTransport
        );

        const [customerEmail, internalEmail] = results.map(cleanMailForSnaphot);
        expect(customerEmail.message).toMatchSnapshot();
        expect(internalEmail.message).toMatchSnapshot();
    });
});

describe('Youth capacity fund', () => {
    const form = require('../youth-capacity/form-model');
    const formCopy = get(enCopy, form.lang);
    const { processor, formatDataForStorage } = require('../youth-capacity/processor');

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

    it('should format data for storage', () => {
        const stepsData = stepsWithValues(form.steps, mockFormData);
        const result = formatDataForStorage(stepsData, formCopy);
        expect(result).toMatchSnapshot();
    });

    it('should create success emails', async () => {
        const results = await processor(
            {
                form: form,
                data: flattenFormData(mockFormData),
                copy: get(enCopy, form.lang),
                stepsWithValues: stepsWithValues(form.steps, mockFormData)
            },
            mockTransport,
            false
        );

        const [customerEmail, internalEmail] = results.map(cleanMailForSnaphot);

        expect(customerEmail.message).toMatchSnapshot();
        expect(internalEmail.message).toMatchSnapshot();
    });
});
