'use strict';
const path = require('path');
const { includes, values } = require('lodash');
const moment = require('moment');

const processor = require('./processor');
const validators = require('../validators');

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
 * @property {function} [matchesCondition]
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
 * @property {String} name
 * @property {LocaleString} label
 * @property {LocaleString} [explanation]
 * @property {String} type
 * @property {Object} [attributes]
 * @property {boolean} [isRequired]
 * @property {function} validator
 */

const SESSION_KEY = 'awards-for-all';

const MIN_APPLICANT_AGE = 16;

const ORGANISATION_TYPES = {
    constitutedVoluntaryCommunity: {
        value: 'constituted-voluntary-community',
        label: { en: 'Constituted voluntary or community organisation', cy: '' },
        explanation: { en: 'i.e. not registered as a company or charity', cy: '' }
    },
    unincorporatedRegisteredCharity: {
        value: 'unincorporated-registered-charity',
        label: { en: 'Unincorporated registered charity', cy: '' },
        explanation: { en: 'You will need to provide your charities commission registration number', cy: '' }
    },
    charitableIncorporatedOrganisation: {
        value: 'charitable-incorporated-organisation',
        label: { en: 'Charitable incorporated organisation (CIO)', cy: '' },
        explanation: { en: 'You will need to provide your companies house registration number', cy: '' }
    },
    notForProfitCompany: {
        value: 'not-for-profit-company',
        label: { en: 'Not-for-profit company', cy: '' }
    },
    communityInterestCompany: {
        value: 'community-interest-company',
        label: { en: 'Community interest company (CIC)', cy: '' }
    },
    school: {
        value: 'school',
        label: { en: 'School', cy: '' }
    },
    statutoryBody: {
        value: 'statutory-body',
        label: { en: 'Statutory body', cy: '' }
    }
};

function postcodeField(props) {
    // Allows us to use postcode validation on the client-side
    // via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
    // we have to double-escape the regex patterns here
    // to output it as a string for the HTML pattern attribute
    const POSTCODE_PATTERN = '(gir\\s?0aa|[a-zA-Z]{1,2}\\d[\\da-zA-Z]?\\s?(\\d[a-zA-Z]{2})?)';

    return {
        ...{
            type: 'text',
            attributes: {
                size: 10,
                autocomplete: 'postal-code',
                pattern: POSTCODE_PATTERN
            },
            isRequired: true,
            validator: validators.postcode
        },
        ...props
    };
}

function addressFields(prefix) {
    return [
        {
            name: `${prefix}-address-building-street`,
            label: { en: 'Building and street', cy: '' },
            type: 'text',
            attributes: { size: 50 },
            isRequired: true,
            validator: validators.required({
                en: 'Please provide a building and street',
                cy: ''
            })
        },
        {
            name: `${prefix}-address-town-city`,
            label: { en: 'Town or city', cy: '' },
            type: 'text',
            attributes: { size: 25 },
            isRequired: true,
            validator: validators.required({
                en: 'Please provide a town or city',
                cy: ''
            })
        },
        {
            name: `${prefix}-address-county`,
            label: { en: 'County', cy: '' },
            type: 'text',
            attributes: { size: 25 },
            isRequired: true,
            validator: validators.required({
                en: 'Please provide a county',
                cy: ''
            })
        },
        postcodeField({
            name: `${prefix}-address-postcode`,
            label: { en: 'Postcode', cy: '' }
        })
    ];
}

const FIELDS = {
    projectStartDate: {
        name: 'project-start-date',
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
        type: 'date',
        attributes: {
            min: moment()
                .add(12, 'weeks')
                .format('YYYY-MM-DD')
        },
        isRequired: true,
        validator: validators.futureDate
    },
    projectPostcode: postcodeField({
        name: 'project-postcode',
        label: {
            en: 'What is the postcode of the location where your project will take place?',
            cy: '(WELSH) What is the postcode of the location where your project will take place?'
        },
        explanation: {
            en:
                'If your project will take place across different locations, please use the postcode where most of the project will take place.',
            cy:
                '(WELSH) If your project will take place across different locations, please use the postcode where most of the project will take place.'
        }
    }),
    beneficiaryNumbers: {
        name: 'beneficiary-numbers',
        label: {
            en: 'How many people will benefit from your project?',
            cy: '(WELSH) How many people will benefit from your project?'
        },
        explanation: {
            en: 'Please enter the exact figure, or the closest estimate.',
            cy: '(WELSH) Please enter the exact figure, or the closest estimate.'
        },
        type: 'text',
        isRequired: true,
        validator: validators.required({
            en: 'Please tell us how many people will benefit',
            cy: ''
        })
    },
    yourIdea: {
        name: 'your-idea',
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
        type: 'textarea',
        attributes: {
            rows: 12
        },
        isRequired: true,
        validator: validators.required({
            en: 'Please tell us about your idea',
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
        attributes: {
            rows: 12
        },
        isRequired: true,
        validator: validators.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    projectTotalCosts: {
        name: 'project-total-costs',
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
        type: 'currency',
        isRequired: true,
        validator: validators.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    organisationLegalName: {
        name: 'organisation-legal-name',
        label: {
            en: 'What is the full legal name of your organisation?',
            cy: '(WELSH) What is the full legal name of your organisation, as shown on your governing document?'
        },
        explanation: {
            en: `
            <p>This must be as shown on your <strong>governing document</strong>. Your governing document could be called one of several things, depending on the type of organisation you're applying on behalf of. It may be called a constitution, trust deed, memorandum and articles of association, or something else entirely.</p>
            `,
            cy: 'TODO'
        },
        type: 'text',
        isRequired: true,
        validator: validators.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    organisationAlias: {
        name: 'organisation-alias',
        label: { en: 'Does your organisation use a different name in your day-to-day work?', cy: '' },
        type: 'text',
        isRequired: false,
        validator: validators.optional
    },
    organisationType: {
        name: 'organisation-type',
        label: { en: 'What type of organisation are you?', cy: '(WELSH) What type of organisation are you?' },
        type: 'radio',
        options: values(ORGANISATION_TYPES),
        validator: validators.required({
            en: 'Field must be provided',
            cy: ''
        })
    },
    charityNumber: {
        name: 'charity-number',
        label: { en: 'Charity registration number', cy: '' },
        explanation: {
            en:
                'If you are registered with OSCR, you only need to provide the last five digits of your registration number.',
            cy: ''
        },
        type: 'number',
        isRequired: false,
        // @TODO: Reinstate validation check
        validator: validators.optional
    },
    companyNumber: {
        name: 'company-number',
        label: { en: 'Companies house number', cy: '' },
        type: 'number',
        // @TODO: Reinstate validation check
        validator: validators.optional
    },
    accountingYearDate: {
        name: 'accounting-year-date',
        label: { en: 'What is your accounting year end date?', cy: '' },
        type: 'date',
        attributes: {
            max: moment().format('YYYY-MM-DD')
        },
        isRequired: true,
        validator: validators.pastDate
    },
    totalIncomeYear: {
        name: 'total-income-year',
        label: { en: 'What is your total income for the year?', cy: '' },
        type: 'currency',
        isRequired: true,
        validator: validators.required({
            en: 'Provide your total income for the year',
            cy: ''
        })
    },
    mainContactName: {
        name: 'main-contact-name',
        label: { en: 'Full name', cy: '' },
        type: 'text',
        attributes: {
            autocomplete: 'name',
            spellcheck: 'false'
        },
        isRequired: true,
        validator: validators.required({
            en: 'Enter your full name',
            cy: ''
        })
    },
    mainContactDob: {
        name: 'main-contact-dob',
        label: { en: 'Date of birth', cy: '' },
        type: 'date',
        attributes: {
            max: moment()
                .subtract(MIN_APPLICANT_AGE, 'years')
                .format('YYYY-MM-DD')
        },
        isRequired: true,
        validator: validators.dateOfBirth(MIN_APPLICANT_AGE)
    },
    mainContactEmail: {
        name: 'main-contact-email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' },
        type: 'email',
        isRequired: true,
        validator: validators.emailRequired
    },
    mainContactPhone: {
        name: 'main-contact-phone',
        type: 'tel',
        attributes: {
            size: 30,
            autocomplete: 'tel'
        },
        label: { en: 'UK telephone number', cy: '' },
        isRequired: true,
        validator: validators.required({
            en: 'Please provide a phone number',
            cy: ''
        })
    },
    mainContactCommunicationNeeds: {
        name: 'main-contact-communication-needs',
        label: { en: 'Does this contact have any communication needs?', cy: '' },
        type: 'radio',
        options: [
            { value: 'audiotape', label: { en: 'Audiotape', cy: '' } },
            { value: 'braille', label: { en: 'Braille', cy: '' } },
            { value: 'large-print', label: { en: 'Large print', cy: '' } }
        ],
        validator: validators.optional
    },
    legalContactName: {
        name: 'legal-contact-name',
        label: { en: 'Full name', cy: '' },
        type: 'text',
        attributes: {
            autocomplete: 'name',
            spellcheck: 'false'
        },
        isRequired: true,
        validator: validators.required({
            en: 'Enter your full name',
            cy: ''
        })
    },
    legalContactDob: {
        name: 'legal-contact-dob',
        type: 'date',
        label: { en: 'Date of birth', cy: '' },
        isRequired: true,
        validator: validators.dateOfBirth(MIN_APPLICANT_AGE)
    },
    legalContactAddressBuildingStreet: {
        name: 'legal-contact-address-building-street',
        label: { en: 'Building and street', cy: '' },
        type: 'text',
        attributes: { size: 50 },
        isRequired: true,
        validator: validators.required({
            en: 'Please provide a building and street',
            cy: ''
        })
    },
    legalContactAddressTownCity: {
        name: 'legal-contact-address-town-city',
        label: { en: 'Town or city', cy: '' },
        type: 'text',
        attributes: { size: 25 },
        isRequired: true,
        validator: validators.required({
            en: 'Please provide a town or city',
            cy: ''
        })
    },
    legalContactAddressCounty: {
        name: 'legal-contact-address-county',
        label: { en: 'County', cy: '' },
        type: 'text',
        attributes: { size: 25 },
        isRequired: true,
        validator: validators.required({
            en: 'Please provide a county',
            cy: ''
        })
    },
    legalContactAddressPostcode: postcodeField({
        name: 'legal-contact-address-postcode',
        label: { en: 'Postcode', cy: '' }
    }),
    legalContactEmail: {
        name: 'legal-contact-email',
        type: 'email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' },
        isRequired: true,
        validator: validators.emailRequired
    },
    legalContactPhone: {
        name: 'legal-contact-phone',
        autocompleteName: 'tel',
        type: 'tel',
        size: 30,
        label: { en: 'Contact number', cy: '' },
        isRequired: true,
        validator: validators.required({
            en: 'Please provide a phone number',
            cy: ''
        })
    },
    legalContactCommunicationNeeds: {
        name: 'legal-contact-communication-needs',
        type: 'radio',
        label: { en: 'Does this contact have any communication needs?', cy: '' },
        options: [
            { value: 'audiotape', label: { en: 'Audiotape', cy: '' } },
            { value: 'braille', label: { en: 'Braille', cy: '' } },
            { value: 'large-print', label: { en: 'Large print', cy: '' } }
        ],
        validator: validators.optional
    },
    bankAccountName: {
        name: 'bank-account-name',
        label: { en: 'Name on the bank account', cy: '' },
        explanation: { en: 'Name of your organisation as it appears on your bank statement', cy: '' },
        type: 'text',
        isRequired: true,
        validator: validators.required({
            en: 'Please provide the name on the account',
            cy: ''
        })
    },
    bankSortCode: {
        name: 'bank-sort-code',
        label: { en: 'Sort code', cy: '' },
        type: 'number',
        attributes: {
            size: 20
        },
        isRequired: true,
        validator: validators.required({
            en: 'Please provide a sort code',
            cy: ''
        })
    },
    bankAccountNumber: {
        name: 'bank-account-number',
        label: { en: 'Account number', cy: '' },
        type: 'number',
        isRequired: true,
        validator: validators.required({
            en: 'Please provide a bank account number',
            cy: ''
        })
    },
    bankBuildingSocietyNumber: {
        name: 'bank-building-society-number',
        label: { en: 'Building society number (if applicable)', cy: '' },
        type: 'number',
        explanation: {
            en: 'This is only applicable if your organisation’s account is with a building society.',
            cy: ''
        },
        validator: validators.optional
    },
    bankStatement: {
        name: 'bank-statement',
        label: { en: 'Upload a bank statement', cy: '' },
        type: 'file',
        isRequired: true,
        validator: validators.required({
            en: 'Please provide a bank statement',
            cy: ''
        })
    },
    terms: [
        {
            name: 'terms-agreement-1',
            type: 'checkbox',
            label: {
                en:
                    'You have been authorised by the governing body of your organisation (the board or committee that runs your organisation) to submit this application and to accept the Terms and Conditions set out above on their behalf.',
                cy: ''
            },
            options: [{ value: 'yes', label: { en: 'I agree', cy: '' } }],
            isRequired: true,
            validator: validators.required({
                en: 'Please provide your agreement',
                cy: ''
            })
        },
        {
            name: 'terms-agreement-2',
            type: 'checkbox',
            label: {
                en:
                    'All the information you have provided in your application is accurate and complete; and you will notify us of any changes.',
                cy: ''
            },
            options: [{ value: 'yes', label: { en: 'I agree', cy: '' } }],
            isRequired: true,
            validator: validators.required({
                en: 'Please provide your agreement',
                cy: ''
            })
        },
        {
            name: 'terms-agreement-3',
            type: 'checkbox',
            label: {
                en:
                    'You understand that we will use any personal information you have provided for the purposes described under the Data Protection Statement.',
                cy: ''
            },
            options: [{ value: 'yes', label: { en: 'I agree', cy: '' } }],
            isRequired: true,
            validator: validators.required({
                en: 'Please provide your agreement',
                cy: ''
            })
        },
        {
            name: 'terms-agreement-4',
            type: 'checkbox',
            label: {
                en:
                    'If information about this application is requested under the Freedom of Information Act, we will release it in line with our Freedom of Information policy.',
                cy: ''
            },
            options: [{ value: 'yes', label: { en: 'I agree', cy: '' } }],
            isRequired: true,
            validator: validators.required({
                en: 'Please provide your agreement',
                cy: ''
            })
        },
        {
            name: 'terms-person-name',
            autocompleteName: 'name',
            type: 'text',
            label: { en: 'Full name of person completing this form', cy: '' },
            isRequired: true,
            validator: validators.required({
                en: 'Enter the full name',
                cy: ''
            })
        },
        {
            name: 'terms-person-position',
            autocompleteName: 'position',
            type: 'text',
            label: { en: 'Position in organisation', cy: '' },
            isRequired: true,
            validator: validators.required({
                en: 'Enter the position',
                cy: ''
            })
        }
    ],
    applicationTitle: {
        name: 'application-title',
        type: 'text',
        label: { en: 'Funding application title', cy: '' },
        isRequired: true,
        validator: validators.required({
            en: 'Please provide a title',
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
    title: { en: 'Your organisation', cy: '' },
    introduction: {
        en:
            'Please tell us about your organisation, including legal name, registered address and income. This helps us understand the type of organisation you are.',
        cy: '(WELSH) TBC'
    },
    steps: [
        {
            title: { en: 'Organisation details', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'Organisation details', cy: '' },
                    fields: [FIELDS.organisationLegalName, FIELDS.organisationAlias]
                },
                {
                    legend: { en: 'What is the main or registered address of your organisation?', cy: '' },
                    fields: addressFields('organisation')
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
            title: { en: 'Charity number', cy: '' },
            matchesCondition: function(formData) {
                return formData['organisation-type'] === ORGANISATION_TYPES.unincorporatedRegisteredCharity.value;
            },
            fieldsets: [
                {
                    legend: { en: 'Charity number', cy: '' },
                    fields: [FIELDS.charityNumber]
                }
            ]
        },
        {
            title: { en: 'Company number', cy: '' },
            matchesCondition: function(formData) {
                return includes(
                    [
                        ORGANISATION_TYPES.charitableIncorporatedOrganisation.value,
                        ORGANISATION_TYPES.notForProfitCompany.value,
                        ORGANISATION_TYPES.communityInterestCompany.value
                    ],
                    formData['organisation-type']
                );
            },
            fieldsets: [
                {
                    legend: { en: 'Company number', cy: '' },
                    fields: [FIELDS.companyNumber]
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
    introduction: {
        en:
            'Please provide details for your main contact. This will be the first person we contact if we need to discuss your project.',
        cy: '(WELSH) TBC'
    },
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
                    fields: [FIELDS.mainContactName, FIELDS.mainContactDob]
                },
                {
                    legend: { en: 'Address', cy: '' },
                    fields: addressFields('main-contact')
                },
                {
                    legend: { en: 'Contact details', cy: '' },
                    fields: [FIELDS.mainContactEmail, FIELDS.mainContactPhone, FIELDS.mainContactCommunicationNeeds]
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
    introduction: {
        en:
            'Please provide details for your legally responsible contact. This person will be legally responsible for the funding and must be unconnected to the main contact.',
        cy: '(WELSH) TBC'
    },
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
                    fields: [FIELDS.legalContactName, FIELDS.legalContactDob]
                },
                {
                    legend: { en: 'Address', cy: '' },
                    fields: addressFields('legal-contact')
                },
                {
                    legend: { en: 'Contact details', cy: '' },
                    fields: [FIELDS.legalContactEmail, FIELDS.legalContactPhone, FIELDS.legalContactCommunicationNeeds]
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
    introduction: {
        en:
            'Please provide your bank details. Before you submit your application you will need to attach a copy of a bank statement that is less than two months old.',
        cy: '(WELSH) TBC'
    },
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
 * @property {String} sessionKey
 * @property {LocaleString} title
 * @property {boolean} isBilingual
 * @property {Array<Section>} sections
 * @property {Function} processor
 * @property {Object} startPage
 * @property {Object} successStep
 */

module.exports = {
    /**
     * @type FormModel
     */
    formModel: {
        sessionKey: SESSION_KEY,
        title: { en: 'National Lottery Awards for All', cy: '' },
        isBilingual: true,
        sections: [sectionProject, sectionOrganisation, sectionMainContact, sectionLegalContact, sectionBankDetails],
        processor: processor,
        termsFields: FIELDS.terms,
        titleField: FIELDS.applicationTitle,
        startPage: { template: path.resolve(__dirname, '../views/startpage') },
        successStep: { template: path.resolve(__dirname, '../views/success') }
    }
};
