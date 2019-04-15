/* eslint-env jest */
'use strict';
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const nodemailer = require('nodemailer');
const { get, map } = require('lodash');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const { flattenFormData, stepsWithValues } = require('../helpers');

function createMockForm() {
    return {
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
}

describe('reaching communities processor', async () => {
    const form = require('../reaching-communities/form-model');
    const processor = require('../reaching-communities/processor');

    const langData = fs.readFileSync(path.resolve(__dirname, '../../../config/locales/en.yml'), 'utf-8');
    const enCopy = yaml.safeLoad(langData);
    const formCopy = get(enCopy, form.lang);

    const mockTransport = nodemailer.createTransport({
        jsonTransport: true
    });

    const mockProcessorData = {
        data: flattenFormData(createMockForm()),
        copy: formCopy,
        stepsWithValues: stepsWithValues(form.steps, createMockForm())
    };

    test('customer email', async () => {
        const result = await processor(mockProcessorData, mockTransport);
        const customerEmail = result[0];
        const customerEmailMessage = JSON.parse(customerEmail.message);
        expect(customerEmailMessage.text).toMatchSnapshot();

        const dom = new JSDOM(customerEmailMessage.html);

        const summaryEl = dom.window.document.querySelector('.summary');

        expect(map(summaryEl.querySelectorAll('h4'), h => h.textContent)).toEqual([
            'Your idea',
            'Project location',
            'Your organisation',
            'Your details'
        ]);

        expect(map(summaryEl.querySelectorAll('h5'), h => h.textContent)).toEqual([
            'Briefly explain your idea and why it’ll make a difference',
            'Select all regions that apply',
            'Project location',
            'Legal name',
            'First name',
            'Last name',
            'Email address',
            'Phone number'
        ]);

        expect(map(summaryEl.querySelectorAll('h5 + p'), h => h.textContent)).toEqual([
            'Test idea',
            'South West',
            'London',
            'Test Organisation',
            'Example',
            'Person',
            'example@example.com',
            '03454102030'
        ]);
    });

    test('internal email', async () => {
        const result = await processor(mockProcessorData, mockTransport);
        const internalEmail = result[1];
        const internalEmailMessage = JSON.parse(internalEmail.message);
        expect(internalEmailMessage.text).toMatchSnapshot();

        const dom = new JSDOM(internalEmailMessage.html);

        const summaryEl = dom.window.document.querySelector('.summary');

        expect(map(summaryEl.querySelectorAll('h4'), h => h.textContent)).toEqual([
            'Your details',
            'Your organisation',
            'Project location',
            'Your idea'
        ]);

        expect(map(summaryEl.querySelectorAll('h5'), h => h.textContent)).toEqual([
            'First name',
            'Last name',
            'Email address',
            'Phone number',
            'Legal name',
            'Select all regions that apply',
            'Project location',
            'Briefly explain your idea and why it’ll make a difference'
        ]);

        expect(map(summaryEl.querySelectorAll('h5 + p'), h => h.textContent)).toEqual([
            'Example',
            'Person',
            'example@example.com',
            '03454102030',
            'Test Organisation',
            'South West',
            'London',
            'Test idea'
        ]);
    });
});
