'use strict';
const { includes } = require('lodash');
const path = require('path');

const { schema, allFields, organisationTypes } = require('./fields');
const processor = require('./processor');
const validatorsLegacy = require('../validators-legacy');

const SESSION_KEY = 'awards-for-all';

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
                    fields: [allFields.projectStartDate, allFields.projectPostcode]
                }
            ]
        },
        {
            title: { en: 'Your idea', cy: '(WELSH) Your idea' },
            fieldsets: [
                {
                    legend: { en: 'Your idea', cy: '(WELSH) Your idea' },
                    fields: [allFields.yourIdea]
                }
            ]
        },
        {
            title: { en: 'Project costs', cy: '(WELSH) Project costs' },
            fieldsets: [
                {
                    legend: { en: 'Project costs', cy: '(WELSH) Project costs' },
                    fields: [allFields.projectBudget, allFields.projectTotalCosts]
                }
            ]
        }
    ]
};

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
                    fields: [allFields.organisationLegalName, allFields.organisationAlias]
                },
                {
                    legend: { en: 'What is the main or registered address of your organisation?', cy: '' },
                    fields: [
                        allFields.organisationAddressBuildingStreet,
                        allFields.organisationAddressTownCity,
                        allFields.organisationAddressCounty,
                        allFields.organisationAddressPostcode
                    ]
                }
            ]
        },
        {
            title: { en: 'Organisation type', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'Organisation type', cy: '' },
                    fields: [allFields.organisationType]
                }
            ]
        },
        {
            title: { en: 'Charity number', cy: '' },
            matchesCondition: function(formData) {
                return formData['organisation-type'] === organisationTypes.unincorporatedRegisteredCharity.value;
            },
            fieldsets: [
                {
                    legend: { en: 'Charity number', cy: '' },
                    fields: [allFields.charityNumber]
                }
            ]
        },
        {
            title: { en: 'Company number', cy: '' },
            matchesCondition: function(formData) {
                return includes(
                    [
                        organisationTypes.charitableIncorporatedOrganisation.value,
                        organisationTypes.notForProfitCompany.value,
                        organisationTypes.communityInterestCompany.value
                    ],
                    formData['organisation-type']
                );
            },
            fieldsets: [
                {
                    legend: { en: 'Company number', cy: '' },
                    fields: [allFields.companyNumber]
                }
            ]
        },
        {
            title: { en: 'Organisation finances', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'Organisation finances', cy: '' },
                    fields: [allFields.accountingYearDate, allFields.totalIncomeYear]
                }
            ]
        }
    ]
};

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
                    fields: [allFields.mainContactName, allFields.mainContactDob]
                },
                {
                    legend: { en: 'Address', cy: '' },
                    fields: [
                        allFields.mainContactAddressBuildingStreet,
                        allFields.mainContactAddressTownCity,
                        allFields.mainContactAddressCounty,
                        allFields.mainContactAddressPostcode
                    ]
                },
                {
                    legend: { en: 'Contact details', cy: '' },
                    fields: [
                        allFields.mainContactEmail,
                        allFields.mainContactPhone,
                        allFields.mainContactCommunicationNeeds
                    ]
                }
            ]
        }
    ]
};

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
                    fields: [allFields.legalContactName, allFields.legalContactDob]
                },
                {
                    legend: { en: 'Address', cy: '' },
                    fields: [
                        allFields.legalContactAddressBuildingStreet,
                        allFields.legalContactAddressTownCity,
                        allFields.legalContactAddressCounty,
                        allFields.legalContactAddressPostcode
                    ]
                },
                {
                    legend: { en: 'Contact details', cy: '' },
                    fields: [
                        allFields.legalContactEmail,
                        allFields.legalContactPhone,
                        allFields.legalContactCommunicationNeeds
                    ]
                }
            ]
        }
    ]
};

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
                        allFields.bankAccountName,
                        allFields.bankSortCode,
                        allFields.bankAccountNumber,
                        allFields.bankBuildingSocietyNumber
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
                    fields: [allFields.bankStatement]
                }
            ]
        }
    ]
};

module.exports = {
    formModel: {
        sessionKey: SESSION_KEY,
        title: { en: 'National Lottery Awards for All', cy: '' },
        isBilingual: true,
        sections: [sectionProject, sectionOrganisation, sectionMainContact, sectionLegalContact, sectionBankDetails],
        termsFields: [
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
                validator: validatorsLegacy.required({
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
                validator: validatorsLegacy.required({
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
                validator: validatorsLegacy.required({
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
                validator: validatorsLegacy.required({
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
                validator: validatorsLegacy.required({
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
                validator: validatorsLegacy.required({
                    en: 'Enter the position',
                    cy: ''
                })
            }
        ],
        titleField: {
            name: 'application-title',
            type: 'text',
            label: { en: 'Funding application title', cy: '' },
            isRequired: true,
            validator: validatorsLegacy.required({
                en: 'Please provide a title',
                cy: ''
            })
        },
        schema: schema,
        processor: processor,
        startPage: { template: path.resolve(__dirname, '../views/startpage') },
        successStep: { template: path.resolve(__dirname, '../views/success') }
    }
};
