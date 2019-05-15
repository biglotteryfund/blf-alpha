'use strict';
const { get, getOr } = require('lodash/fp');
const { compact, includes, reduce, sumBy } = require('lodash');

const { Joi } = require('../lib/validators');
const enrichForm = require('../lib/enrich-form');
const { formatDate } = require('../lib/formatters');
const { BENEFICIARY_GROUPS, ORGANISATION_TYPES } = require('./constants');
const fieldsFor = require('./fields');

module.exports = function({ locale, data = {} }) {
    const localise = get(locale);
    const currentOrganisationType = get('organisation-type')(data);

    const fields = fieldsFor({ locale, data });

    function includeAddressAndDob() {
        return (
            includes(
                [ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY],
                currentOrganisationType
            ) === false
        );
    }

    function includeCompanyNumber() {
        return (
            currentOrganisationType ===
            ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
        );
    }

    function includeCharityNumber() {
        return includes(
            [
                ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                ORGANISATION_TYPES.CIO,
                ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
            ],
            currentOrganisationType
        );
    }

    function includeEducationNumber() {
        return currentOrganisationType === ORGANISATION_TYPES.SCHOOL;
    }

    const sectionProject = {
        slug: 'your-project',
        title: localise({ en: 'Your Project', cy: '(WELSH) Your Project' }),
        summary: localise({
            en: `Please tell us about your project in this section. This is the most important section when it comes to making a decision about whether you will receive funding.`,
            cy: `(WELSH) Please tell us about your project in this section. This is the most important section when it comes to making a decision about whether you will receive funding.`
        }),
        steps: [
            {
                title: localise({ en: 'Project details', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Project details', cy: '' }),
                        fields: [fields.projectName, fields.projectStartDate]
                    }
                ]
            },
            {
                title: localise({ en: 'Project country', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Project country', cy: '' }),
                        fields: [fields.projectCountry]
                    }
                ]
            },
            {
                title: localise({ en: 'Project location', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Project location', cy: '' }),
                        fields: [
                            fields.projectLocation,
                            fields.projectLocationDescription,
                            fields.projectPostcode
                        ]
                    }
                ]
            },
            {
                title: localise({ en: 'Your idea', cy: '(WELSH) Your idea' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Your idea',
                            cy: '(WELSH) Your idea'
                        }),
                        fields: [
                            fields.yourIdeaProject,
                            fields.yourIdeaPriorities,
                            fields.yourIdeaCommunity
                        ]
                    }
                ]
            },
            {
                title: localise({
                    en: 'Project costs',
                    cy: '(WELSH) Project costs'
                }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Project costs',
                            cy: '(WELSH) Project costs'
                        }),
                        fields: [fields.projectBudget, fields.projectTotalCosts]
                    }
                ]
            }
        ]
    };

    function sectionBeneficiaries() {
        const groupsCheck = get('beneficiaries-groups-check')(data);
        const groupChoices = get('beneficiaries-groups')(data);

        function fieldsForGroup(type) {
            let result;
            switch (type) {
                case BENEFICIARY_GROUPS.ETHNIC_BACKGROUND:
                    result = [fields.beneficiariesEthnicBakground];
                    break;
                case BENEFICIARY_GROUPS.GENDER:
                    result = [fields.beneficiariesGroupsGender];
                    break;
                case BENEFICIARY_GROUPS.AGE:
                    result = [fields.beneficiariesGroupsAge];
                    break;
                case BENEFICIARY_GROUPS.DISABILITY:
                    result = [fields.beneficiariesGroupsDisabledPeople];
                    break;
                case BENEFICIARY_GROUPS.RELIGION:
                    result = [
                        fields.beneficiariesGroupsReligion,
                        fields.beneficiariesGroupsReligionOther
                    ];
                    break;
                default:
                    result = [];
                    break;
            }

            return groupsCheck === 'yes' && includes(groupChoices, type)
                ? result
                : [];
        }

        return {
            slug: 'beneficiaries',
            title: localise({
                en: 'Who will benefit from your project?',
                cy: ''
            }),
            shortTitle: localise({ en: 'Beneficiaries', cy: '' }),
            summary: localise({
                en: `We want to hear more about the people who will benefit from your project.`,
                cy: ``
            }),
            steps: [
                {
                    title: localise({
                        en: `Specific groups of people`,
                        cy: ``
                    }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: `Specific groups of people`,
                                cy: ``
                            }),
                            introduction: localise({
                                en: `<p>We want to hear more about the people who will benefit from your project.</p>
                
                                <p>It's important to be as accurate as possible in your answers. We'll use this information to make better decisions about how our funding supports people and communities. We'll also use it to tell people about the impact of our funding and who it is reaching.</p>
                
                                <p>However, the information you provide here is <strong>not assessed</strong> and <strong>will not</strong> be used to decide whether you will be awarded funding for your project.</p>`,
                                cy: ``
                            }),
                            fields: [fields.beneficiariesGroupsCheck]
                        }
                    ]
                },
                {
                    title: localise({
                        en: 'Specific groups of people',
                        cy: ''
                    }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: 'Specific groups of people',
                                cy: ''
                            }),
                            fields: compact([
                                groupsCheck === 'yes' &&
                                    fields.beneficiariesGroups,
                                groupsCheck === 'yes' &&
                                    fields.beneficiariesGroupsOther
                            ])
                        }
                    ]
                },
                {
                    title: localise({ en: 'Ethnic background', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: 'Ethnic background',
                                cy: ''
                            }),
                            fields: fieldsForGroup(
                                BENEFICIARY_GROUPS.ETHNIC_BACKGROUND
                            )
                        }
                    ]
                },
                {
                    title: localise({ en: 'Gender', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Gender', cy: '' }),
                            fields: fieldsForGroup(BENEFICIARY_GROUPS.GENDER)
                        }
                    ]
                },
                {
                    title: localise({ en: 'Age', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Age', cy: '' }),
                            fields: fieldsForGroup(BENEFICIARY_GROUPS.AGE)
                        }
                    ]
                },
                {
                    title: localise({ en: 'Disabled people', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Disabled people', cy: '' }),
                            fields: fieldsForGroup(
                                BENEFICIARY_GROUPS.DISABILITY
                            )
                        }
                    ]
                },
                {
                    title: localise({ en: 'Religion or belief', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: 'Religion or belief',
                                cy: ''
                            }),
                            fields: fieldsForGroup(BENEFICIARY_GROUPS.RELIGION)
                        }
                    ]
                }
            ]
        };
    }

    const sectionOrganisation = {
        slug: 'organisation',
        title: localise({ en: 'Your organisation', cy: '' }),
        summary: localise({
            en: `Please tell us about your organisation, including legal name, registered address and income. This helps us understand the type of organisation you are.`,
            cy: ''
        }),
        steps: [
            {
                title: localise({ en: 'Organisation details', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Organisation details',
                            cy: ''
                        }),
                        fields: [
                            fields.organisationLegalName,
                            fields.organisationAlias,
                            fields.organisationAddress
                        ]
                    }
                ]
            },
            {
                title: localise({ en: 'Organisation type', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Organisation type', cy: '' }),
                        fields: [fields.organisationType]
                    }
                ]
            },
            {
                title: localise({ en: 'Registration numbers', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Registration numbers',
                            cy: ''
                        }),
                        fields: compact([
                            includeCompanyNumber() && fields.companyNumber,
                            includeCharityNumber() && fields.charityNumber,
                            includeEducationNumber() && fields.educationNumber
                        ])
                    }
                ]
            },
            {
                title: localise({ en: 'Organisation finances', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Organisation finances',
                            cy: ''
                        }),
                        fields: [
                            fields.accountingYearDate,
                            fields.totalIncomeYear
                        ]
                    }
                ]
            }
        ]
    };

    const sectionMainContact = {
        slug: 'main-contact',
        title: localise({ en: 'Main contact', cy: '' }),
        summary: localise({
            en: `Please provide details for your main contact. This will be the first person we contact if we need to discuss your project.`,
            cy: ``
        }),
        steps: [
            {
                title: localise({ en: 'Main contact', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Who is your main contact?',
                            cy: ''
                        }),
                        introduction: localise({
                            en: `<p>
                                The main contact is the person we can get in touch with if we have any questions about your project.
                                While your main contact needs to be from the organisation applying, they don't need to hold a particular position.
                            </p>
                            <p>
                                The main contact must be unconnected to the senior contact.
                                By ‘unconnected’ we mean not related by blood, marriage,
                                in a long-term relationship or people living together at the same address.
                            </p>`,
                            cy: ''
                        }),
                        fields: compact([
                            fields.mainContactFirstName,
                            fields.mainContactLastName,
                            includeAddressAndDob() && fields.mainContactDob,
                            includeAddressAndDob() && fields.mainContactAddress,
                            includeAddressAndDob() &&
                                fields.mainContactAddressHistory,
                            fields.mainContactEmail,
                            fields.mainContactPhone,
                            fields.mainContactCommunicationNeeds
                        ])
                    }
                ]
            }
        ]
    };

    const sectionSeniorContact = {
        slug: 'senior-contact',
        title: localise({ en: 'Senior contact', cy: '' }),
        summary: localise({
            en: `Please provide details for your senior contact. This person will be legally responsible for the funding and must be unconnected to the main contact.`,
            cy: ``
        }),
        steps: [
            {
                title: localise({ en: 'Senior contact', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Who is your senior contact?',
                            cy: ''
                        }),
                        introduction: localise({
                            en: `<p>Please give us the contact details of a senior member of your organisation.</p>
                            <p>Your senior contact must be at least 18 years old and is legally responsible for ensuring that this application is supported by the organisation applying, any funding is delivered as set out in the application form, and that the funded organisation meets our monitoring requirements.</p>`,
                            cy: ``
                        }),
                        fields: compact([
                            fields.seniorContactFirstName,
                            fields.seniorContactLastName,
                            fields.seniorContactRole,
                            includeAddressAndDob() && fields.seniorContactDob,
                            includeAddressAndDob() &&
                                fields.seniorContactAddress,
                            includeAddressAndDob() &&
                                fields.seniorContactAddressHistory,
                            fields.seniorContactEmail,
                            fields.seniorContactPhone,
                            fields.seniorContactCommunicationNeeds
                        ])
                    }
                ]
            }
        ]
    };

    const sectionBankDetails = {
        slug: 'bank-details',
        title: localise({ en: 'Bank details', cy: '' }),
        summary: localise({
            en: `Please provide your bank details. Before you submit your application you will need to attach a copy of a bank statement that is less than two months old.`,
            cy: ''
        }),
        steps: [
            {
                title: localise({ en: 'Bank account', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'What are your bank account details?',
                            cy: ''
                        }),
                        introduction: localise({
                            en:
                                'This should be the legal name of your organisation as it appears on your bank statement, not the name of your bank. This will usually be the same as your organisation’s name on your governing document.',
                            cy: ''
                        }),
                        fields: [
                            fields.bankAccountName,
                            fields.bankSortCode,
                            fields.bankAccountNumber,
                            fields.bankBuildingSocietyNumber
                        ]
                    }
                ]
            },
            {
                title: localise({ en: 'Bank statement', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Bank statement', cy: '' }),
                        introduction: localise({
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
                        }),
                        fields: [fields.bankStatement]
                    }
                ]
            }
        ]
    };

    const termsFields = [
        {
            name: 'terms-agreement-1',
            type: 'checkbox',
            label: localise({
                en:
                    'You have been authorised by the governing body of your organisation (the board or committee that runs your organisation) to submit this application and to accept the Terms and Conditions set out above on their behalf.',
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            isRequired: true
        },
        {
            name: 'terms-agreement-2',
            type: 'checkbox',
            label: localise({
                en:
                    'All the information you have provided in your application is accurate and complete; and you will notify us of any changes.',
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            isRequired: true
        },
        {
            name: 'terms-agreement-3',
            type: 'checkbox',
            label: localise({
                en:
                    'You understand that we will use any personal information you have provided for the purposes described under the Data Protection Statement.',
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            isRequired: true
        },
        {
            name: 'terms-agreement-4',
            type: 'checkbox',
            label: localise({
                en:
                    'If information about this application is requested under the Freedom of Information Act, we will release it in line with our Freedom of Information policy.',
                cy: ''
            }),
            options: [
                { value: 'yes', label: localise({ en: 'I agree', cy: '' }) }
            ],
            isRequired: true
        },
        {
            name: 'terms-person-name',
            label: localise({
                en: 'Full name of person completing this form',
                cy: ''
            }),
            type: 'text',
            isRequired: true,
            attributes: { autocomplete: 'name' }
        },
        {
            name: 'terms-person-position',
            label: localise({ en: 'Position in organisation', cy: '' }),
            type: 'text',
            isRequired: true
        }
    ];

    function schema() {
        const computed = Joi.object(
            reduce(
                fields,
                function(acc, field) {
                    acc[field.name] = field.schema;
                    return acc;
                },
                {}
            )
        );

        return computed;
    }

    function summary() {
        const startDate = get('project-start-date')(data);
        const organisation = get('organisation-legal-name')(data);
        const budget = getOr([], 'project-budget')(data);
        const budgetSum = sumBy(budget, item => parseInt(item.cost || 0));

        return [
            {
                label: localise({ en: 'Organisation', cy: '' }),
                value: organisation
            },
            {
                label: localise({ en: 'Proposed start date', cy: '' }),
                value: startDate && formatDate(startDate)
            },
            {
                label: localise({ en: 'Requested amount', cy: '' }),
                value: budget.length > 0 && `£${budgetSum.toLocaleString()}`
            }
        ];
    }

    const form = {
        id: 'awards-for-all',
        title: localise({ en: 'National Lottery Awards for All', cy: '' }),
        isBilingual: true,
        schema: schema(),
        summary: summary(),
        sections: [
            sectionProject,
            sectionBeneficiaries(),
            sectionOrganisation,
            sectionMainContact,
            sectionSeniorContact,
            sectionBankDetails
        ],
        termsFields: termsFields
    };

    return enrichForm(form, data);
};
