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
        title: `Digital Funding: Strand ${strandNumber}`,
        subtitle:
            'The <a href="/funding/programmes/digital-funding">Digital Funding programme</a> makes grants of £100,000 to £500,000 to help civil society organisations to become more successful and more impactful.',
        pageAccent: strandNumber === 1 ? 'blue' : 'cyan',
        shortCode: `DF-STRAND-${strandNumber}`,
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
        reviewStep: {
            title: 'Check this is right before submitting your information',
            proceedLabel: 'Submit'
        },
        successStep: {
            template: path.resolve(__dirname, './success')
        },
        errorStep: {
            title: 'There was an problem submitting your information',
            message: `
            <p>There was a problem submitting your information, we have been notified of the problem.</p>
            <p>Please return to the review step and try again. If you still see an error please call <a href="tel:03454102030">0345 4 10 20 30</a> (Monday–Friday 9am–5pm).</p>`
        }
    };
};
