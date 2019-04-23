'use strict';
const { schema, allFields } = require('./fields');
const processor = require('./processor');
const validateModel = require('../lib/validate-model');

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
            title: { en: 'Project details', cy: '(cy) Project details' },
            fieldsets: [
                {
                    legend: { en: 'Project details', cy: '' },
                    fields: [
                        allFields.applicationTitle,
                        allFields.projectStartDate,
                        allFields.applicationCountry,
                        allFields.projectPostcode
                    ]
                }
            ]
        },
        {
            title: { en: 'Your idea', cy: '(WELSH) Your idea' },
            fieldsets: [
                {
                    legend: { en: 'Your idea', cy: '(WELSH) Your idea' },
                    fields: [allFields.yourIdeaProject, allFields.yourIdeaPriorities, allFields.yourIdeaCommunity]
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
                    fields: [
                        allFields.organisationLegalName,
                        allFields.organisationAlias,
                        allFields.organisationAddress
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
            title: { en: 'Registration numbers', cy: '' },
            fieldsets: [
                {
                    legend: { en: 'Registration numbers', cy: '' },
                    fields: [allFields.companyNumber, allFields.charityNumber]
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
                    fields: [
                        allFields.mainContactName,
                        allFields.mainContactDob,
                        allFields.mainContactAddress,
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
                    fields: [
                        allFields.legalContactName,
                        allFields.legalContactRole,
                        allFields.legalContactDob,
                        allFields.legalContactAddress,
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

const formModel = {
    id: 'awards-for-all',
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
            isRequired: true
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
            isRequired: true
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
            isRequired: true
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
            isRequired: true
        },
        {
            name: 'terms-person-name',
            autocompleteName: 'name',
            type: 'text',
            label: { en: 'Full name of person completing this form', cy: '' },
            isRequired: true
        },
        {
            name: 'terms-person-position',
            autocompleteName: 'position',
            type: 'text',
            label: { en: 'Position in organisation', cy: '' },
            isRequired: true
        }
    ],
    // @TODO i18n - move these to locale files when they're signed off
    eligibilityQuestions: [
        {
            question: 'Does your organisation have at least two unconnected people on the board or committee?',
            explanation:
                'By unconnected, we mean not a relation by blood, marriage, in a long-term relationship or people living together at the same address.',
            ineligibleReason:
                'This is because you declared that your organisation does not have at least two unconnected people on the board or committee'
        },
        {
            question:
                'Are you applying for an amount between £300 and £10,000 for a project that will be finished within about 12 months?',
            explanation:
                "We know it's not always possible to complete a project in 12 months for lots of reasons. We can therefore consider projects which are slightly longer than this. We will also consider applications for one-off events such as a festival, gala day or conference.",
            ineligibleReason:
                'This is because you declared that your organisation does not need an amount between £300 and £10,000 for a project that will be finished within about 12 months.'
        },
        {
            question: 'Does your project start at least 12 weeks from when you plan to submit your application?',
            explanation:
                "We need 12 weeks to be able to assess your application and pay your grant, if you're successful. Therefore, projects need to start at least 12 weeks from the date you submit your application to us.",
            ineligibleReason:
                "This is because you declared that your project doesn't start at least 12 weeks from when we plan to submit your application."
        },
        {
            question:
                'Do you have a UK bank account in the legal name of your organisation, with at least two unrelated people who are able to manage the account?',
            explanation:
                "This should be the legal name of your organisation as it appears on your bank statement, not the name of your bank. This will usually be the same as your organisation's name on your governing document.",
            ineligibleReason:
                "This is because you declared that your organisation doesn't have a UK bank account in the name of your organisation."
        },
        {
            question:
                "Do you produce annual accounts (or did you set up your organisation less than 15 months ago and haven't produced annual accounts yet)?",
            explanation:
                "By annual accounts, we mean a summary of your financial activity. If you are a small organisation, this may be produced by your board and doesn't have to be done by an accountant.",
            ineligibleReason:
                "This is because you declared that your organisation hasn't produced annual accounts, or that your your organisation was set up less than 15 months ago and has not yet produced annual accounts."
        }
    ],
    schema: schema,
    processor: processor,
    programmePage: '/funding/programmes/national-lottery-awards-for-all-england'
};

validateModel(formModel);

module.exports = {
    formModel: formModel
};
