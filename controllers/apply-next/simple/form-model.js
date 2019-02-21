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
 * @property {LocaleString} [introduction]
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
    optional: function(field) {
        return check(field.name)
            .trim()
            .optional();
    },
    required: function(message) {
        return function(field) {
            return check(field.name)
                .trim()
                .not()
                .isEmpty()
                .withMessage(localiseMessage(message));
        };
    },
    email: function(field) {
        return check(field.name)
            .trim()
            .isEmail()
            .withMessage(
                localiseMessage({
                    en: 'Please provide a valid email address',
                    cy: ''
                })
            );
    },
    postcode: function(field) {
        return check(field.name)
            .isPostalCode('GB')
            .withMessage(
                localiseMessage({
                    en: 'Must be a valid postcode',
                    cy: 'WELSH ERROR'
                })
            );
    },
    futureDate: function(field) {
        return check(field.name)
            .isAfter()
            .withMessage(
                localiseMessage({
                    en: 'Date must be in the future',
                    cy: 'WELSH ERROR'
                })
            );
    }
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
        validator: VALIDATORS.futureDate
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
        validator: VALIDATORS.postcode
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
        validator: VALIDATORS.required({
            en: 'Please tell us how many people will benefit',
            cy: ''
        })
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
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
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
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        }),
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
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
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
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    organisationType: {
        name: 'organisation-type',
        type: 'radio',
        label: { en: 'What type of organisation are you?', cy: '(WELSH) What type of organisation are you?' },
        options: [
            {
                value: 'voluntary',
                label: { en: 'Voluntary or community organisation', cy: '' },
                explanation: {
                    en:
                        'including registered charities, constituted groups or clubs, not for profit companies, community interest companies and social enterprises',
                    cy: ''
                }
            },
            { value: 'statutory', label: { en: 'Statutory organisation', cy: '' } },
            {
                value: 'school',
                label: { en: 'School', cy: '' },
                explanation: {
                    en: 'including local authorities, health boards, and parish, town and community councils',
                    cy: ''
                }
            },
            { value: 'other', label: { en: 'Other', cy: '' } }
        ],
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    accountingYearDate: {
        name: 'accounting-year-date',
        type: 'date',
        label: { en: 'What is your accounting year end date?', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    totalIncomeYear: {
        name: 'total-income-year',
        type: 'currency',
        label: { en: 'What is your total income for the year?', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    mainContactName: {
        name: 'main-contact-name',
        autocompleteName: 'name',
        type: 'text',
        label: { en: 'Full name', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Enter your full name',
            cy: ''
        })
    },
    mainContactDob: {
        name: 'main-contact-dob',
        type: 'date',
        label: { en: 'Date of birth', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    mainContactAddress: {
        name: 'main-contact-address',
        type: 'text',
        size: 20,
        label: { en: 'What is your main contact’s current home address?', cy: '' },
        explanation: { en: 'Enter the postcode and search for the address.', cy: '' },
        isRequired: true,
        validator: VALIDATORS.postcode
    },
    mainContactEmail: {
        name: 'main-contact-email',
        type: 'email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    mainContactPhonePrimary: {
        name: 'main-contact-phone-primary',
        type: 'tel',
        size: 30,
        label: { en: 'Primary contact number', cy: '' },
        explanation: { en: 'Please provide at least one contact number', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    mainContactPhoneSecondary: {
        name: 'main-contact-phone-secondary',
        type: 'tel',
        size: 30,
        label: { en: 'Secondary contact number', cy: '' },
        explanation: { en: 'A secondary contact number in case we can’t reach you on your primary number.', cy: '' },
        validator: VALIDATORS.optional
    },
    mainContactCommunicationNeeds: {
        name: 'main-contact-communication-needs',
        type: 'select',
        label: { en: 'Please tell us about any communication needs', cy: '' },
        options: [
            { value: '', label: { en: 'Select an option', cy: '' } },
            { value: 'audiotape', label: { en: 'Audiotape', cy: '' } },
            { value: 'braille', label: { en: 'Braille', cy: '' } },
            { value: 'large-print', label: { en: 'Large print', cy: '' } }
        ],
        validator: VALIDATORS.optional
    },
    legalContactName: {
        name: 'legal-contact-name',
        autocompleteName: 'name',
        type: 'text',
        label: { en: 'Full name', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Enter your full name',
            cy: ''
        })
    },
    legalContactDob: {
        name: 'legal-contact-dob',
        type: 'date',
        label: { en: 'Date of birth', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    legalContactAddress: {
        name: 'legal-contact-address',
        type: 'text',
        size: 20,
        label: { en: 'What is your legally responsible contact’s current address?', cy: '' },
        explanation: { en: 'Enter the postcode and search for the address.', cy: '' },
        isRequired: true,
        validator: VALIDATORS.postcode
    },
    legalContactEmail: {
        name: 'legal-contact-email',
        type: 'email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    legalContactPhonePrimary: {
        name: 'legal-contact-phone-primary',
        type: 'tel',
        size: 30,
        label: { en: 'Primary contact number', cy: '' },
        explanation: { en: 'Please provide at least one contact number', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    legalContactPhoneSecondary: {
        name: 'legal-contact-phone-secondary',
        type: 'tel',
        size: 30,
        label: { en: 'Secondary contact number', cy: '' },
        explanation: { en: 'A secondary contact number in case we can’t reach you on your primary number.', cy: '' },
        validator: VALIDATORS.optional
    },
    legalContactCommunicationNeeds: {
        name: 'legal-contact-communication-needs',
        type: 'select',
        label: { en: 'Please tell us about any communication needs', cy: '' },
        options: [
            { value: '', label: { en: 'Select an option', cy: '' } },
            { value: 'audiotape', label: { en: 'Audiotape', cy: '' } },
            { value: 'braille', label: { en: 'Braille', cy: '' } },
            { value: 'large-print', label: { en: 'Large print', cy: '' } }
        ],
        validator: VALIDATORS.optional
    },
    bankAccountName: {
        name: 'bank-account-name',
        type: 'text',
        label: { en: 'Name on the bank account', cy: '' },
        explanation: { en: 'Name of your organisation as it appears on your bank statement', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Please provide the name on the account',
            cy: ''
        })
    },
    bankSortCode: {
        name: 'bank-sort-code',
        type: 'text',
        size: 20,
        label: { en: 'Sort code', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Please provide a sort code',
            cy: ''
        })
    },
    bankAccountNumber: {
        name: 'bank-account-number',
        type: 'text',
        label: { en: 'Account number', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Please provide a bank account number',
            cy: ''
        })
    },
    bankBuildingSocietyNumber: {
        name: 'bank-building-society-number',
        type: 'text',
        label: { en: 'Building society number (if applicable)', cy: '' },
        explanation: {
            en: 'This is only applicable if your organisation’s account is with a building society.',
            cy: ''
        },
        validator: VALIDATORS.optional
    },
    bankStatement: {
        name: 'bank-statement',
        type: 'file',
        label: { en: 'Upload a bank statement', cy: '' },
        isRequired: true,
        validator: VALIDATORS.required({
            en: 'Please provide a bank statement',
            cy: ''
        })
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
        },
        {
            title: { en: 'Organisation type', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'Organisation type', cy: '' },
                    fields: [FIELDS.organisationType]
                }
            ]
        },
        {
            title: { en: 'Organisation finances', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'Organisation finances', cy: '' },
                    fields: [FIELDS.accountingYearDate, FIELDS.totalIncomeYear]
                }
            ]
        }
    ]
};

/**
 * @type Section
 */
const sectionMainContact = {
    slug: 'main-contact',
    title: { en: 'Main contact', cy: '' },
    steps: [
        {
            title: { en: 'Main contact', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'Who is your main contact?', cy: '' },
                    introduction: {
                        en: `
<p>The main contact is the person we can get in touch with if we have any questions about your project. While your main contact needs to be from the organisation applying, they don't need to hold a particular position.</p>

<p>The main contact must be unconnected to the legally responsible contact. By ‘unconnected’ we mean not related by blood, marriage, in a long-term relationship or people living together at the same address.</p>`,
                        cy: ''
                    },
                    fields: [FIELDS.mainContactName, FIELDS.mainContactDob, FIELDS.mainContactAddress]
                },
                {
                    legend: { en: 'Contact details', cy: '' },
                    fields: [
                        FIELDS.mainContactEmail,
                        FIELDS.mainContactPhonePrimary,
                        FIELDS.mainContactPhoneSecondary,
                        FIELDS.mainContactCommunicationNeeds
                    ]
                }
            ]
        }
    ]
};

/**
 * @type Section
 */
const sectionLegalContact = {
    slug: 'legal-contact',
    title: { en: 'Legally responsible contact', cy: '' },
    steps: [
        {
            title: { en: 'Legally responsible contact', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'Who is your legally responsible contact?', cy: '' },
                    introduction: {
                        en: `
<p>This person will be legally responsible for the funding and must be unconnected to the main contact. By ‘unconnected’ we mean not related by blood, marriage, in a long-term relationship or people living together at the same address.</p>

<p>They must be at least 18 years old and are responsible for ensuring that this application is supported by the organisation applying, any funding is delivered as set out in the application form, and that the funded organisation meets our monitoring requirements.</p>

<p>The position held by the legally responsible contact is dependent on the type of organisation you are applying on behalf of. The options given to you for selection are based on this.</p>`,
                        cy: ''
                    },
                    fields: [FIELDS.legalContactName, FIELDS.legalContactDob, FIELDS.legalContactAddress]
                },
                {
                    legend: { en: 'Contact details', cy: '' },
                    fields: [
                        FIELDS.legalContactEmail,
                        FIELDS.legalContactPhonePrimary,
                        FIELDS.legalContactPhoneSecondary,
                        FIELDS.legalContactCommunicationNeeds
                    ]
                }
            ]
        }
    ]
};

/**
 * @type Section
 */
const sectionBankDetails = {
    slug: 'bank-details',
    title: { en: 'Bank details', cy: '' },
    steps: [
        {
            title: { en: 'Bank account', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'What are your bank account details?', cy: '' },
                    introduction: {
                        en:
                            'This should be the legal name of your organisation as it appears on your bank statement, not the name of your bank. This will usually be the same as your organisation’s name on your governing document.',
                        cy: ''
                    },
                    fields: [
                        FIELDS.bankAccountName,
                        FIELDS.bankSortCode,
                        FIELDS.bankAccountNumber,
                        FIELDS.bankBuildingSocietyNumber
                    ]
                }
            ]
        },
        {
            title: { en: 'Bank statement', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'Bank statement', cy: '' },
                    introduction: {
                        en: `
    <p><strong>You must attach your bank statement as a PDF, JPEG or PNG file. Unfortunately we can’t accept Word documents, but photos of your bank statements are absolutely fine.</strong></p>

    <p>Please make sure that we can clearly see the following on your bank statement:</p>

    <ul>
        <li>Your organisation’s legal name</li>
        <li>The address the statements are sent to</li>
        <li>The bank name</li>
        <li>Account number</li>
        <li>Sort code</li>
        <li>Date (must be within last 3 months)</li>
    </ul>

    <p>Your statement needs to be less than three months old. For bank accounts opened within the last three months, we can accept a bank welcome letter. This must confirm the date your account was opened, account name, account number and sort code.</p>

    <p>If you are a school who uses a local authority bank account, please attach a letter from the local authority that confirms your school name, the bank account name and number and sort code. The letter must be on local authority headed paper and dated. Other statutory bodies can attach a letter from their finance department that confirms the details of the bank account funding would be paid into.</p>                 
                        `,
                        cy: ''
                    },
                    fields: [FIELDS.bankStatement]
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
    sections: [sectionProject, sectionOrganisation, sectionMainContact, sectionLegalContact, sectionBankDetails],
    startPage: { template: path.resolve(__dirname, '../views/startpage') },
    successStep: { template: path.resolve(__dirname, '../views/success') }
};

module.exports = form;
