'use strict';
const path = require('path');
const { check } = require('express-validator/check');
const { cloneDeep } = require('lodash');

const processor = require('./processor');

const stepDetails = {
    name: 'Your details',
    fieldsets: [
        {
            legend: 'Your contact details',
            introduction: 'Please tell us a little about your project and organisation so that we can get in touch',
            fields: [
                {
                    type: 'text',
                    name: 'name',
                    autocompleteName: 'name',
                    label: 'Name',
                    isRequired: true
                },
                {
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
                            .withMessage('Please provide your email address')
                            .isEmail()
                            .withMessage('Please provide a valid email address');
                    }
                },
                {
                    type: 'text',
                    name: 'organisation-name',
                    label: 'Organisation name',
                    isRequired: true
                }
            ]
        },
        {
            legend: 'Your organisation',
            introduction: 'Please tell us a little about your project and organisation so that we can get in touch',
            fields: [
                {
                    name: 'about-your-organisation',
                    type: 'textarea',
                    isRequired: true,
                    rows: 12,
                    label: 'About your organisation',
                    helpText: `<p>Briefly tell us:</p>
                        <ul>
                            <li>What your organisation does</li>
                            <li>What sort of significant changes you've been thinking about</li>
                        </ul>`
                }
            ]
        }
    ]
};

// make a copy of the above step and add a question (for alternate strand)
let stepDetailsAdditional = cloneDeep(stepDetails);
stepDetailsAdditional.fieldsets[1].fields.push({
    name: 'how-technology-helps-scale',
    type: 'textarea',
    isRequired: true,
    rows: 12,
    label: 'Briefly tell us how technology helps you scale your impact',
    validator: function(field) {
        return check(field.name)
            .trim()
            .not()
            .isEmpty()
            .withMessage('Please tell us about your organisation');
    }
});

const strandSteps = {
    strand1: [stepDetails],
    strand2: [stepDetailsAdditional]
};

module.exports = strandNumber => {
    return {
        id: `digital-funding-strand-${strandNumber}`,
        title: `Digital Funding Strand ${strandNumber} (Demo)`,
        subtitle:
            'The <a href="/funding/programmes/digital-funding-demo">Digital Funding programme</a> makes grants of £100,000 to £500,000 to help civil society organisations to become more successful and more impactful.',
        pageAccent: 'blue',
        heroSlug: 'whizz-kidz',
        shortCode: `DF${strandNumber}-ALPHA`,
        steps: strandSteps[`strand${strandNumber}`],
        processor: processor,
        startPage: {
            urlPath: `/funding/programmes/digital-funding-demo/strand-${strandNumber}`
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
