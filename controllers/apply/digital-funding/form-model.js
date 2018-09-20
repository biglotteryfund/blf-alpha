'use strict';
const path = require('path');
const { check } = require('express-validator/check');

const processor = require('./processor');

const fieldName = {
    type: 'text',
    name: 'name',
    autocompleteName: 'name',
    label: 'Name',
    isRequired: true
};

const fieldEmail = {
    type: 'email',
    name: 'email',
    autocompleteName: 'email',
    label: 'Email address',
    isRequired: true,
    validator: function(field) {
        return check(field.name)
            .trim()
            .not()
            .isEmpty()
            .isEmail()
            .withMessage('Please provide a valid email address');
    }
};

const fieldOrgName = {
    type: 'text',
    name: 'organisation-name',
    label: 'Organisation name',
    isRequired: true
};

const fieldAbout = {
    name: 'about-your-organisation',
    type: 'textarea',
    isRequired: true,
    label: 'About your organisation',
    helpText:
        'Briefly tell us what your organisation does and what sort of significant changes you’ve been thinking about.',
    lengthHint: {
        rows: 12,
        text: 'Please keep it to a couple of paragraphs'
    }
};

const fieldScale = {
    name: 'how-technology-helps-scale',
    type: 'textarea',
    isRequired: true,
    label: 'Briefly tell us how technology helps you scale your impact',
    lengthHint: {
        rows: 12,
        text: 'Please keep it to a couple of paragraphs'
    }
};

module.exports = strandNumber => {
    return {
        id: `digital-funding-strand-${strandNumber}`,
        lang: 'apply.digitalFundingStrand' + strandNumber,
        pageAccent: strandNumber === 1 ? 'blue' : 'cyan',
        shortCode: `DF-STRAND-${strandNumber}`,
        isBilingual: true,
        steps: [
            {
                name: 'Your details',
                fieldsets: [
                    {
                        legend: 'Your contact details',
                        introduction:
                            'Please tell us a little about your project and organisation so that we can get in touch',
                        fields: [fieldName, fieldEmail, fieldOrgName]
                    },
                    {
                        legend: 'Your organisation',
                        fields: strandNumber === 1 ? [fieldAbout] : [fieldAbout, fieldScale]
                    }
                ]
            }
        ],
        processor: processor,
        startPage: {
            urlPath: `/funding/programmes/digital-funding/strand-${strandNumber}`
        },
        successStep: {
            template: path.resolve(__dirname, './success')
        }
    };
};
