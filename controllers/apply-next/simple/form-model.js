'use strict';
const path = require('path');

const { check } = require('express-validator/check');

/**
 * @typedef {Object} LocaleString
 * @property {string} en
 * @property {string} cy
 */

/**
 * @typedef {Object} Section
 * @property {string} slug
 * @property {LocaleString} title
 * @property {LocaleString} [introduction]
 * @property {Array<Step>} steps
 */

/**
 * @typedef {Object} Step
 * @property {LocaleString} title
 * @property {Array<Fieldset>} fieldsets
 */

/**
 * @typedef {Object} Fieldset
 * @property {LocaleString} legend
 * @property {Array<Field>} fields
 */

/**
 * @typedef {Object} Field
 * @property {string} name
 * @property {string} type
 * @property {LocaleString} label
 * @property {LocaleString} [explanation]
 * @property {boolean} [isRequired]
 * @property {function} validator
 */

function localiseMessage(options) {
    return function(value, { req }) {
        return options[req.i18n.getLocale()];
    };
}

/**
 * Common validators
 */
const VALIDATORS = {
    required: field =>
        check(field.name)
            .trim()
            .not()
            .isEmpty()
            .withMessage(
                localiseMessage({
                    en: 'Field must be provided',
                    cy: '(Welsh) field must be provided'
                })
            ),
    optional: field =>
        check(field.name)
            .trim()
            .optional()
};

const FIELDS = {
    projectStartDate: {
        name: 'project-start-date',
        type: 'date',
        label: {
            en: 'When is the planned (or estimated) start date of your project?',
            cy: '(WELSH) When is the planned (or estimated) start date of your project?'
        },
        explanation: {
            en:
                'This date needs to be at least 12 weeks from when you plan to submit your application. If your project is a one-off event, please tell us the date of the event.',
            cy:
                '(WELSH) This date needs to be at least 12 weeks from when you plan to submit your application. If your project is a one-off event, please tell us the date of the event.'
        },
        isRequired: true,
        validator: function(field) {
            return check(field.name)
                .isAfter()
                .withMessage(
                    localiseMessage({
                        en: 'Date must be in the future',
                        cy: 'WELSH ERROR'
                    })
                );
        }
    },
    projectPostcode: {
        name: 'project-postcode',
        type: 'text',
        label: {
            en: 'What is the postcode of the location where your project will take place?',
            cy: '(WELSH) What is the postcode of the location where your project will take place?'
        },
        explanation: {
            en:
                'If your project will take place across different locations, please use the postcode where most of the project will take place.',
            cy:
                '(WELSH) If your project will take place across different locations, please use the postcode where most of the project will take place.'
        },
        isRequired: true,
        validator: function(field) {
            return check(field.name)
                .isPostalCode('GB')
                .withMessage(
                    localiseMessage({
                        en: 'Must be a valid postcode',
                        cy: 'WELSH ERROR'
                    })
                );
        }
    },
    beneficiaryNumbers: {
        name: 'beneficiary-numbers',
        type: 'text',
        label: {
            en: 'How many people will benefit from your project?',
            cy: '(WELSH) How many people will benefit from your project?'
        },
        explanation: {
            en: 'Please enter the exact figure, or the closest estimate.',
            cy: '(WELSH) Please enter the exact figure, or the closest estimate.'
        },
        isRequired: true,
        validator: VALIDATORS.required
    },
    yourIdea: {
        name: 'your-idea',
        type: 'textarea',
        rows: 12,
        label: {
            en: 'What would you like to do?',
            cy: 'WELSH What would you like to do?'
        },
        explanation: {
            en: `
<p>When answering this question there are two key areas that we will use to make a decision on your project:</p>

<p><strong>1. National Lottery Awards for all has three funding priorities and you must meet at least one of these. Please tell us how your project will:</strong></p>

<ul>
    <li>bring people together and build strong relationships in and across communities</li>
    <li>improve the places and spaces that matter to communities</li>         
    <li>enable more people to fulfil their potential by working to address issues at the earliest possible stage</li>     
</ul>
            
<p><strong>2. It's important to us that you involve your community in the design, development and delivery of the activities you're planning, so please tell us how you've done this.</strong></p>

<p>Here are some ideas about what else to tell us:</p>

<ul>            
    <li>How your project idea came about. Is it something new, or are you continuing something that has worked well previously?</li>
    <li>If you are running a one-off event, what date it will take place</li>
    <li>How long you expect your project to run</li>
    <li>How you will make sure people know about your project and will attend</li>
    <li>How you'll learn from your project and use this to shape future projects</li>
</ul>
            `,
            cy: 'TODO'
        },
        isRequired: true,
        validator: VALIDATORS.required
    },
    projectBudget: {
        name: 'project-budget',
        label: {
            en: 'Please tell us the costs you would like us to fund',
            cy: '(WELSH) Please tell us the costs you would like us to fund'
        },
        explanation: {
            en: `
<p>You should use budget headings, rather than a detailed list of items.</p>
<p>For example, if you're applying for pens, pencils, paper and envelopes, using 'office supplies' is fine.</p>
            `,
            cy: 'TODO'
        },
        type: 'textarea',
        isRequired: true,
        validator: VALIDATORS.required,
        rows: 12
    },
    projectTotalCosts: {
        name: 'project-total-costs',
        type: 'currency',
        label: {
            en: 'Please tell us the total cost of your project.',
            cy: '(WELSH) Please tell us the total cost of your project.'
        },
        explanation: {
            en: `
            <p>This is the cost of everything related to your project, even things you aren't asking us to fund.</p>

            <p>For example, if you are asking us for £8,000 and you are getting £10,000 from another funder to cover additional costs, then your total project cost is £18,000. If you are asking us for £8,000 and there are no other costs then your total project cost is £8,000.</p>
            `,
            cy: 'TODO'
        },
        isRequired: true,
        validator: VALIDATORS.required
    },
    organisationLegalName: {
        name: 'organisation-legal-name',
        type: 'text',
        label: {
            en: 'What is the full legal name of your organisation, as shown on your governing document?',
            cy: '(WELSH) What is the full legal name of your organisation, as shown on your governing document?'
        },
        explanation: {
            en: `
            <p>Your governing document could be called one of several things, depending on the type of organisation you're applying on behalf of. It may be called a constitution, trust deed, memorandum and articles of association, or something else entirely.</p>
            `,
            cy: 'TODO'
        },
        isRequired: true,
        validator: VALIDATORS.required
    }
};

/**
 * @type Section
 */
const sectionProject = {
    slug: 'your-project',
    title: { en: 'Your Project', cy: '(WELSH) Your Project' },
    introduction: {
        en:
            'Please tell us about your project in this section. This is the most important section when it comes to making a decision about whether you will receive funding.',
        cy:
            '(WELSH) Please tell us about your project in this section. This is the most important section when it comes to making a decision about whether you will receive funding.'
    },
    steps: [
        {
            title: { en: 'Project details', cy: '(WELSH) Project details' },
            fieldsets: [
                {
                    legend: { en: 'Get started', cy: '(WELSH) Get started' },
                    /**
                     * @type Array<Field>
                     */
                    fields: [FIELDS.projectStartDate, FIELDS.projectPostcode]
                }
            ]
        },
        {
            title: { en: 'Your idea', cy: '(WELSH) Your idea' },
            fieldsets: [
                {
                    legend: { en: 'Your idea', cy: '(WELSH) Your idea' },
                    fields: [FIELDS.yourIdea]
                }
            ]
        },
        {
            title: { en: 'Project costs', cy: '(WELSH) Project costs' },
            fieldsets: [
                {
                    legend: { en: 'Project costs', cy: '(WELSH) Project costs' },
                    fields: [FIELDS.projectBudget, FIELDS.projectTotalCosts]
                }
            ]
        }
    ]
};

/**
 * @type Section
 */
const sectionOrganisation = {
    slug: 'organisation',
    title: { en: 'Your organisation', cy: '(WELSH) Your organisation' },
    steps: [
        {
            title: { en: 'Organisation details', cy: '(WELSH) Organisation details' },
            fieldsets: [
                {
                    legend: { en: 'Organisation details', cy: '(WELSH) Organisation details' },
                    fields: [FIELDS.organisationLegalName]
                }
            ]
        }
    ]
};

/**
 * @typedef {Object} FormModel
 * @property {string} id
 * @property {LocaleString} title
 * @property {boolean} isBilingual
 * @property {Array<Section>} sections
 * @property {Object} startPage,
 * @property {Object} successStep
 */

/**
 * @type FormModel
 */
const form = {
    id: 'awards-for-all',
    title: {
        en: 'National Lottery Awards for All',
        cy: '(WELSH) National Lottery Awards for All'
    },
    isBilingual: true,
    sections: [sectionProject, sectionOrganisation],
    startPage: { template: path.resolve(__dirname, '../views/startpage') },
    successStep: { template: path.resolve(__dirname, '../views/success') }
};

module.exports = form;
