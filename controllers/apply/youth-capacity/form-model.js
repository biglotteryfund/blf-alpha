'use strict';
const path = require('path');

const processor = require('./processor');
const { validateIsEmail } = require('../helpers');

const formLang = 'apply.youthCapacity';

const PROJECT_LOCATIONS = [{ value: 'Birmingham' }, { value: 'Bradford' }, { value: 'Barking and Dagenham' }];

const PROJECT_AIMS = [{ value: 'Build capacity' }, { value: 'Develop partnerships' }];

const stepCurrentWork = {
    fieldsets: [
        {
            fields: [
                {
                    name: 'current-work',
                    type: 'textarea',
                    isRequired: true,
                    rows: 12
                }
            ]
        }
    ]
};

const stepGrant = {
    fieldsets: [
        {
            fields: [
                {
                    name: 'location',
                    type: 'radio',
                    options: PROJECT_LOCATIONS,
                    isRequired: true
                },
                {
                    name: 'money',
                    type: 'textarea',
                    isRequired: true,
                    rows: 12
                }
            ]
        }
    ]
};

const stepLocation = {
    fieldsets: [
        {
            fields: [
                {
                    name: 'project-aims',
                    type: 'radio',
                    options: PROJECT_AIMS,
                    isRequired: true
                },
                {
                    name: 'people-and-communities',
                    type: 'textarea',
                    isRequired: true,
                    rows: 12
                }
            ]
        }
    ]
};

const stepDetails = {
    fieldsets: [
        {
            fields: [
                {
                    type: 'text',
                    name: 'organisation-name',
                    isRequired: true
                }
            ]
        },
        {
            fields: [
                {
                    type: 'text',
                    name: 'contact-name',
                    isRequired: true
                },
                {
                    type: 'email',
                    name: 'contact-email',
                    autocompleteName: 'email',
                    isRequired: true,
                    validator: function(field) {
                        return validateIsEmail(formLang, field.name);
                    }
                },
                {
                    type: 'text',
                    name: 'contact-phone',
                    autocompleteName: 'tel',
                    isRequired: true
                }
            ]
        }
    ]
};

module.exports = {
    id: 'youth-capacity-funding',
    shortCode: 'YCF',
    lang: formLang,
    isBilingual: false,
    steps: [stepCurrentWork, stepGrant, stepLocation, stepDetails],
    processor: processor,
    startPage: { template: path.resolve(__dirname, './startpage') },
    successStep: { template: path.resolve(__dirname, './success') }
};
