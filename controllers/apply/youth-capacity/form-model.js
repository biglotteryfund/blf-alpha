'use strict';
const path = require('path');

const { processor } = require('./processor');
const { validateIsEmail } = require('../helpers');
const { PROJECT_AIMS, PROJECT_LOCATIONS, GROUP_CHOICES } = require('./constants');

const formLang = 'apply.youthCapacity';

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

const stepHowYouWillUse = {
    fieldsets: [
        {
            fields: [
                {
                    name: 'how-you-will-use',
                    type: 'radio',
                    options: PROJECT_AIMS,
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
                    name: 'location',
                    type: 'radio',
                    options: PROJECT_LOCATIONS,
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

const stepOrgInfo = {
    fieldsets: [
        {
            fields: [
                {
                    name: 'group-size',
                    type: 'checkbox',
                    options: GROUP_CHOICES,
                    isRequired: false
                },
                {
                    name: 'annual-income',
                    type: 'currency',
                    isRequired: false
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
                    name: 'organisation-name',
                    type: 'text',
                    isRequired: true
                },
                {
                    name: 'organisation-address',
                    type: 'textarea',
                    isRequired: true
                }
            ]
        },
        {
            fields: [
                {
                    name: 'contact-name',
                    type: 'text',
                    isRequired: true
                },
                {
                    name: 'contact-email',
                    type: 'email',
                    autocompleteName: 'email',
                    isRequired: true,
                    validator: function(field) {
                        return validateIsEmail(formLang, field.name);
                    }
                },
                {
                    name: 'contact-phone',
                    type: 'text',
                    autocompleteName: 'tel',
                    isRequired: true
                }
            ]
        }
    ]
};

module.exports = {
    id: 'youth-capacity-fund',
    shortCode: 'YCF',
    lang: formLang,
    isBilingual: false,
    steps: [stepCurrentWork, stepHowYouWillUse, stepLocation, stepOrgInfo, stepDetails],
    processor: processor,
    startPage: { template: path.resolve(__dirname, './startpage') },
    successStep: { template: path.resolve(__dirname, './success') }
};
