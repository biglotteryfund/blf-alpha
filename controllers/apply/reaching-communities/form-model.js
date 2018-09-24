'use strict';
const path = require('path');

const processor = require('./processor');
const { PROJECT_LOCATIONS } = require('./helpers');
const { validateIsEmail } = require('../helpers');

const formLang = 'apply.reachingCommunities';

const stepIdea = {
    fieldsets: [
        {
            fields: [
                {
                    name: 'your-idea',
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
                    type: 'checkbox',
                    options: PROJECT_LOCATIONS,
                    isRequired: true,
                    name: 'location'
                },
                {
                    type: 'text',
                    name: 'project-location',
                    isRequired: true,
                    size: 60
                }
            ]
        }
    ]
};

const stepOrganisation = {
    fieldsets: [
        {
            fields: [
                {
                    type: 'text',
                    name: 'organisation-name',
                    isRequired: true
                },
                {
                    type: 'text',
                    name: 'additional-organisations',
                    isRequired: false,
                    size: 60
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
                    name: 'first-name',
                    autocompleteName: 'given-name',
                    isRequired: true
                },
                {
                    type: 'text',
                    name: 'last-name',
                    autocompleteName: 'family-name',
                    isRequired: true
                },
                {
                    type: 'email',
                    name: 'email',
                    autocompleteName: 'email',
                    isRequired: true,
                    validator: function(field) {
                        return validateIsEmail(formLang, field.name);
                    }
                },
                {
                    type: 'text',
                    name: 'phone-number',
                    autocompleteName: 'tel',
                    isRequired: true
                }
            ]
        }
    ]
};

module.exports = {
    id: 'reaching-communities-idea',
    shortCode: 'RC',
    lang: formLang,
    isBilingual: false,
    steps: [stepIdea, stepLocation, stepOrganisation, stepDetails],
    processor: processor,
    startPage: { template: path.resolve(__dirname, './startpage') },
    successStep: { template: path.resolve(__dirname, './success') }
};
