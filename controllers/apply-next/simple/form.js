'use strict';
const { get } = require('lodash/fp');
const { castArray, includes, reduce } = require('lodash');

const { Joi } = require('../lib/validators');
const enrichForm = require('../lib/enrich-form');
const { ORGANISATION_TYPES, BENEFICIARY_GROUPS } = require('./constants');

const fieldsFor = require('./fields');

module.exports = function({ locale, data = {} }) {
    const localise = get(locale);
    const orgTypeFor = get('organisation-type');

    const allFields = fieldsFor({ locale, data });

    const schema = Joi.object(
        reduce(
            allFields,
            function(acc, field) {
                acc[field.name] = field.schema;
                return acc;
            },
            {}
        )
    );

    const includeAddressAndDob =
        includes([ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY], orgTypeFor(data)) === false;

    const sectionProject = {
        slug: 'your-project',
        title: localise({ en: 'Your Project', cy: '(WELSH) Your Project' }),
        introduction: localise({
            en: `Please tell us about your project in this section. This is the most important section when it comes to making a decision about whether you will receive funding.`,
            cy: ``
        }),
        steps: [
            {
                title: localise({ en: 'Project details', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Project details', cy: '' }),
                        fields: [
                            allFields.projectName,
                            allFields.projectStartDate,
                            allFields.projectCountry,
                            allFields.projectPostcode
                        ]
                    }
                ]
            },
            {
                title: localise({ en: 'Your idea', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Your idea', cy: '' }),
                        fields: [allFields.yourIdeaProject, allFields.yourIdeaPriorities, allFields.yourIdeaCommunity]
                    }
                ]
            },
            {
                title: localise({ en: 'Project costs', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Project costs', cy: '' }),
                        fields: [allFields.projectBudget, allFields.projectTotalCosts]
                    }
                ]
            }
        ]
    };

    function fieldsForBeneficiaryGroup(type) {
        let fields;
        switch (type) {
            case BENEFICIARY_GROUPS.GENDER:
                fields = [allFields.beneficiariesGroupsGender];
                break;
            case BENEFICIARY_GROUPS.AGE:
                fields = [allFields.beneficiariesGroupsAge];
                break;
            case BENEFICIARY_GROUPS.DISABILITY:
                fields = [allFields.beneficiariesGroupsDisability];
                break;
            case BENEFICIARY_GROUPS.FAITH:
                fields = [allFields.beneficiariesGroupsFaith, allFields.beneficiariesGroupsFaithOther];
                break;
            default:
                fields = [];
                break;
        }

        const groupsChoices = castArray(get(allFields.beneficariesGroups.name)(data));
        const matches = includes(groupsChoices, type);

        if (matches) {
            return fields;
        } else {
            return [];
        }
    }

    const sectionBeneficiaries = {
        slug: 'beneficiaries',
        title: localise({ en: 'Beneficiaries', cy: '' }),
        introduction: localise({
            en: `We want to hear more about the people who will benefit from your project.`,
            cy: ``
        }),
        get steps() {
            return [
                {
                    title: localise({ en: 'Number of people', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Number of people', cy: '' }),
                            fields: [allFields.beneficiariesNumberOfPeople]
                        }
                    ]
                },
                {
                    title: localise({ en: 'Local authority', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Local authority', cy: '' }),
                            fields: [allFields.beneficiariesLocationCheck]
                        }
                    ]
                },
                {
                    title: localise({ en: 'Location', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Location', cy: '' }),
                            get fields() {
                                let fields = [];
                                if (get(allFields.beneficiariesLocationCheck.name)(data) === 'yes') {
                                    fields = [
                                        allFields.beneficiariesLocalAuthority,
                                        allFields.beneficiariesLocationDescription
                                    ];
                                }
                                return fields;
                            }
                        }
                    ]
                },
                {
                    title: localise({ en: 'Specific groups of people', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Specific groups of people', cy: '' }),
                            fields: [allFields.beneficariesGroups, allFields.beneficiariesGroupsOther]
                        }
                    ]
                },
                {
                    title: localise({ en: 'Gender', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Gender', cy: '' }),
                            fields: fieldsForBeneficiaryGroup(BENEFICIARY_GROUPS.GENDER)
                        }
                    ]
                },
                {
                    title: localise({ en: 'Age', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Age', cy: '' }),
                            fields: fieldsForBeneficiaryGroup(BENEFICIARY_GROUPS.AGE)
                        }
                    ]
                },
                {
                    title: localise({ en: 'Disability', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Disability', cy: '' }),
                            fields: fieldsForBeneficiaryGroup(BENEFICIARY_GROUPS.DISABILITY)
                        }
                    ]
                },
                {
                    title: localise({ en: 'Religion or belief', cy: '' }),
                    fieldsets: [
                        {
                            legend: localise({ en: 'Religion or belief', cy: '' }),
                            fields: fieldsForBeneficiaryGroup(BENEFICIARY_GROUPS.FAITH)
                        }
                    ]
                }
            ];
        }
    };

    const sectionOrganisation = {
        slug: 'organisation',
        title: localise({ en: 'Your organisation', cy: '' }),
        introduction: localise({
            en: `Please tell us about your organisation, including legal name, registered address and income. This helps us understand the type of organisation you are.`,
            cy: ''
        }),
        steps: [
            {
                title: localise({ en: 'Organisation details', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Organisation details', cy: '' }),
                        fields: [
                            allFields.organisationLegalName,
                            allFields.organisationAlias,
                            allFields.organisationAddress
                        ]
                    }
                ]
            },
            {
                title: localise({ en: 'Organisation type', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Organisation type', cy: '' }),
                        fields: [allFields.organisationType]
                    }
                ]
            },
            {
                title: localise({ en: 'Registration numbers', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Registration numbers', cy: '' }),
                        get fields() {
                            function matchesTypes(orgTypes) {
                                return includes(orgTypes, orgTypeFor(data));
                            }

                            const fields = [];
                            if (matchesTypes([ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY])) {
                                fields.push(allFields.companyNumber);
                            }

                            if (
                                matchesTypes([
                                    ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                                    ORGANISATION_TYPES.CIO,
                                    ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
                                ])
                            ) {
                                fields.push(allFields.charityNumber);
                            }

                            if (matchesTypes([ORGANISATION_TYPES.SCHOOL])) {
                                fields.push(allFields.educationNumber);
                            }

                            return fields;
                        }
                    }
                ]
            },
            {
                title: localise({ en: 'Organisation finances', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Organisation finances', cy: '' }),
                        fields: [allFields.accountingYearDate, allFields.totalIncomeYear]
                    }
                ]
            }
        ]
    };

    const sectionMainContact = {
        slug: 'main-contact',
        title: localise({ en: 'Main contact', cy: '' }),
        introduction: localise({
            en: `Please provide details for your main contact. This will be the first person we contact if we need to discuss your project.`,
            cy: ``
        }),
        steps: [
            {
                title: localise({ en: 'Main contact', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Who is your main contact?', cy: '' }),
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
                        get fields() {
                            if (includeAddressAndDob) {
                                return [
                                    allFields.mainContactFirstName,
                                    allFields.mainContactLastName,
                                    allFields.mainContactDob,
                                    allFields.mainContactAddress,
                                    allFields.mainContactAddressHistory,
                                    allFields.mainContactEmail,
                                    allFields.mainContactPhone,
                                    allFields.mainContactCommunicationNeeds
                                ];
                            } else {
                                return [
                                    allFields.mainContactFirstName,
                                    allFields.mainContactLastName,
                                    allFields.mainContactEmail,
                                    allFields.mainContactPhone,
                                    allFields.mainContactCommunicationNeeds
                                ];
                            }
                        }
                    }
                ]
            }
        ]
    };

    const sectionSeniorContact = {
        slug: 'senior-contact',
        title: localise({ en: 'Senior contact', cy: '' }),
        introduction: localise({
            en: `Please provide details for your senior contact. This person will be legally responsible for the funding and must be unconnected to the main contact.`,
            cy: ``
        }),
        steps: [
            {
                title: localise({ en: 'Senior contact', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Who is your senior contact?', cy: '' }),
                        introduction: localise({
                            en: `<p>Please give us the contact details of a senior member of your organisation.</p>
                            <p>Your senior contact must be at least 18 years old and is legally responsible for ensuring that this application is supported by the organisation applying, any funding is delivered as set out in the application form, and that the funded organisation meets our monitoring requirements.</p>`,
                            cy: ``
                        }),
                        get fields() {
                            if (includeAddressAndDob) {
                                return [
                                    allFields.seniorContactFirstName,
                                    allFields.seniorContactLastName,
                                    allFields.seniorContactRole,
                                    allFields.seniorContactDob,
                                    allFields.seniorContactAddress,
                                    allFields.seniorContactAddressHistory,
                                    allFields.seniorContactEmail,
                                    allFields.seniorContactPhone,
                                    allFields.seniorContactCommunicationNeeds
                                ];
                            } else {
                                return [
                                    allFields.seniorContactFirstName,
                                    allFields.seniorContactLastName,
                                    allFields.seniorContactRole,
                                    allFields.seniorContactEmail,
                                    allFields.seniorContactPhone,
                                    allFields.seniorContactCommunicationNeeds
                                ];
                            }
                        }
                    }
                ]
            }
        ]
    };

    const sectionBankDetails = {
        slug: 'bank-details',
        title: localise({ en: 'Bank details', cy: '' }),
        introduction: localise({
            en: `Please provide your bank details. Before you submit your application you will need to attach a copy of a bank statement that is less than two months old.`,
            cy: ''
        }),
        steps: [
            {
                title: localise({ en: 'Bank account', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'What are your bank account details?', cy: '' }),
                        introduction: localise({
                            en:
                                'This should be the legal name of your organisation as it appears on your bank statement, not the name of your bank. This will usually be the same as your organisation’s name on your governing document.',
                            cy: ''
                        }),
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
                        fields: [allFields.bankStatement]
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
            options: [{ value: 'yes', label: localise({ en: 'I agree', cy: '' }) }],
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
            options: [{ value: 'yes', label: localise({ en: 'I agree', cy: '' }) }],
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
            options: [{ value: 'yes', label: localise({ en: 'I agree', cy: '' }) }],
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
            options: [{ value: 'yes', label: localise({ en: 'I agree', cy: '' }) }],
            isRequired: true
        },
        {
            name: 'terms-person-name',
            label: localise({ en: 'Full name of person completing this form', cy: '' }),
            type: 'text',
            isRequired: true,
            attributes: { autocomplete: 'name' }
        },
        {
            name: 'terms-person-position',
            label: localise({ en: 'Position in organisation', cy: '' }),
            type: 'text',
            isRequired: true,
            attributes: { autocomplete: 'position' }
        }
    ];

    const form = {
        id: 'awards-for-all',
        title: localise({ en: 'National Lottery Awards for All', cy: '' }),
        isBilingual: true,
        schema: schema,
        allFields: allFields,
        sections: [
            sectionProject,
            sectionBeneficiaries,
            sectionOrganisation,
            sectionMainContact,
            sectionSeniorContact,
            sectionBankDetails
        ],
        termsFields: termsFields
    };

    // @TODO: Minimise transformations in enrich-form
    return enrichForm(form, data);
};
