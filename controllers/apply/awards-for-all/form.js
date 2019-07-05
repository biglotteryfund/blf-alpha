'use strict';
const clone = require('lodash/clone');
const compact = require('lodash/compact');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const has = require('lodash/fp/has');
const includes = require('lodash/includes');
const sumBy = require('lodash/sumBy');
const Sentry = require('@sentry/node');

const { FormModel } = require('../form-router-next/lib/form-model');
const { fromDateParts } = require('../form-router-next/lib/date-parts');
const { formatDateRange } = require('../form-router-next/lib/formatters');
const { BENEFICIARY_GROUPS, ORGANISATION_TYPES } = require('./constants');
const fieldsFor = require('./fields');
const termsCopy = require('./terms');

const checkBankAccountDetails = require('../../../common/bank-api');
const commonLogger = require('../../../common/logger');

module.exports = function({ locale, data = {} }) {
    const localise = get(locale);
    const currentOrganisationType = get('organisationType')(data);

    const logger = commonLogger.child({
        service: 'form-awards-for-all'
    });

    const fields = fieldsFor({
        locale: locale,
        data: data
    });

    function selectedCountry(country) {
        return get('projectCountry')(data) === country;
    }

    function includeAddressAndDob() {
        return (
            includes(
                [
                    ORGANISATION_TYPES.SCHOOL,
                    ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
                    ORGANISATION_TYPES.STATUTORY_BODY
                ],
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
        return includes(
            [
                ORGANISATION_TYPES.SCHOOL,
                ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY
            ],
            currentOrganisationType
        );
    }

    function includeAccountDetails() {
        return get('organisationStartDate.isBeforeMin')(data) === true;
    }

    const sectionProject = {
        slug: 'your-project',
        title: localise({ en: 'Your project', cy: '(WELSH) Your project' }),
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
                        fields: [fields.projectName, fields.projectDateRange]
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
                ],
                message: {
                    title:
                        'Applying for a project in England, Northern Ireland or Wales?',
                    body: `<a href="https://apply.tnlcommunityfund.org.uk">You’ll need to use this form instead</a>. Only applicants in Scotland can apply through our new online form at the moment. We’re working on making this available for the rest of the UK.`
                }
            },
            {
                title: localise({ en: 'Project location', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Project location', cy: '' }),
                        get fields() {
                            const hasCountry = has('projectCountry')(data);
                            return compact([
                                hasCountry && fields.projectLocation,
                                hasCountry && fields.projectLocationDescription,
                                hasCountry && fields.projectPostcode
                            ]);
                        }
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
        const groupChoices = get('beneficiariesGroups')(data);

        function fieldsForGroup(type) {
            let result;
            switch (type) {
                case BENEFICIARY_GROUPS.ETHNIC_BACKGROUND:
                    result = [fields.beneficiariesEthnicBackground];
                    break;
                case BENEFICIARY_GROUPS.GENDER:
                    result = [fields.beneficiariesGroupsGender];
                    break;
                case BENEFICIARY_GROUPS.AGE:
                    result = [fields.beneficiariesGroupsAge];
                    break;
                case BENEFICIARY_GROUPS.DISABLED_PEOPLE:
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

            return includes(groupChoices, type) ? result : [];
        }

        return {
            slug: 'beneficiaries',
            title: localise({
                en: 'Who will benefit from your project?',
                cy: ''
            }),
            shortTitle: localise({ en: 'Who will benefit', cy: '' }),
            summary: localise({
                en: `We want to hear more about the people who will benefit from your project.`,
                cy: ``
            }),
            steps: [
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
                            fields: [
                                fields.beneficiariesGroups,
                                fields.beneficiariesGroupsOther
                            ]
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
                                BENEFICIARY_GROUPS.DISABLED_PEOPLE
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
                },
                {
                    title: localise({
                        en: `People who speak Welsh`,
                        cy: ``
                    }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: `People who speak Welsh`,
                                cy: ``
                            }),
                            fields: selectedCountry('wales')
                                ? [fields.beneficiariesWelshLanguage]
                                : []
                        }
                    ]
                },
                {
                    title: localise({
                        en: `Community`,
                        cy: ``
                    }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: `Community`,
                                cy: ``
                            }),
                            fields: selectedCountry('northern-ireland')
                                ? [fields.beneficiariesNorthernIrelandCommunity]
                                : []
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
                            fields.organisationTradingName,
                            fields.organisationStartDate,
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
                get organisationType() {
                    return get('organisationType')(data);
                },
                get title() {
                    let title;
                    switch (this.organisationType) {
                        case ORGANISATION_TYPES.STATUTORY_BODY:
                            title = localise({
                                en: 'Type of statutory body',
                                cy: ''
                            });
                            break;
                        default:
                            title = localise({
                                en: 'Organisation sub-type',
                                cy: ''
                            });
                            break;
                    }
                    return title;
                },
                get fieldsets() {
                    let fieldsForStep;
                    switch (this.organisationType) {
                        case ORGANISATION_TYPES.STATUTORY_BODY:
                            fieldsForStep = [
                                fields.organisationSubTypeStatutoryBody
                            ];
                            break;
                        default:
                            fieldsForStep = [];
                            break;
                    }

                    return [
                        {
                            legend: this.title,
                            fields: fieldsForStep
                        }
                    ];
                }
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
                        fields: compact([
                            includeAccountDetails() &&
                                fields.accountingYearDate,
                            includeAccountDetails() && fields.totalIncomeYear
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
            en: `Please provide details for your senior contact. This person will be legally responsible for the funding. They can't be married, in a long-term relationship, living with, or related to the main contact.`,
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
                        get introduction() {
                            function roleText() {
                                let result;
                                switch (currentOrganisationType) {
                                    case ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY:
                                    case ORGANISATION_TYPES.CIO:
                                    case ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY:
                                        result = localise({
                                            en: `<p>This person must be a member of your board or committee.</p>`,
                                            cy: ''
                                        });
                                        break;
                                    case ORGANISATION_TYPES.SCHOOL:
                                        result = localise({
                                            en: `<p>If you are a school, this person must be the headteacher.</p>`,
                                            cy: ''
                                        });
                                        break;
                                    default:
                                        result = localise({
                                            en: `<p>This person is usually a senior leader, or a member of your board or committee.</p>`,
                                            cy: ''
                                        });
                                        break;
                                }

                                return result;
                            }

                            return [
                                localise({
                                    en: `<p>Please give us the contact details of a senior member of your organisation.</p>`,
                                    cy: ``
                                }),
                                roleText(),
                                localise({
                                    en: `<p>Your senior contact must be at least 18 years old and is legally responsible for ensuring that this application is supported by the organisation applying, any funding is delivered as set out in the application form, and that the funded organisation meets our monitoring requirements.</p>`,
                                    cy: ''
                                })
                            ].join('\n');
                        },
                        fields: compact([
                            fields.seniorContactRole,
                            fields.seniorContactName,
                            includeAddressAndDob() &&
                                fields.seniorContactDateOfBirth,
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
                        get introduction() {
                            const seniorFirstName = get(
                                'seniorContactName.firstName'
                            )(data);
                            const seniorSurname = get(
                                'seniorContactName.lastName'
                            )(data);
                            const seniorName =
                                seniorFirstName && seniorSurname
                                    ? `, ${seniorFirstName} ${seniorSurname}`
                                    : '';
                            const mainSurname = get('mainContactName.lastName')(
                                data
                            );

                            let contactSameNameWarning = '';
                            if (seniorSurname === mainSurname) {
                                contactSameNameWarning = `<p><strong>We've noticed that your main and senior contact have the same surname. Remember we can't fund projects where the two contacts are married or related by blood.</strong></p>`;
                            }

                            return localise({
                                en: `<p>
                                        Please give us the contact details of a person we can get in touch with if we have any questions. The main contact is usually the person filling in the form - so it's probably you. The main contact needs to be from the organisation applying, but they don't need to hold a particular position.    
                                    </p>
                                    <p>
                                        The main contact must be a different person from the senior contact${seniorName}. 
                                        The two contacts also can't be married or in a long-term relationship with each 
                                        other, living together at the same address, or related by blood.
                                    </p>${contactSameNameWarning}`,
                                cy: ''
                            });
                        },
                        fields: compact([
                            fields.mainContactName,
                            includeAddressAndDob() &&
                                fields.mainContactDateOfBirth,
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

    const sectionBankDetails = {
        slug: 'bank-details',
        title: localise({ en: 'Bank details', cy: '' }),
        summary: localise({
            en: `Please provide your bank details. Before you submit your application you will need to attach a copy of a bank statement that is less than three months old`,
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
                            en: `
                                <p>This should be the legal name of your organisation as it appears on your bank statement - not the name of your bank. This will usually be the same as your organisation’s name on your governing document.</p>
                                <p><strong>The kinds of bank accounts we don't accept</strong></p>
                                <p>We can't transfer money into certain types of bank accounts like Tide, Cashplus and Paypal.</p>
                                `,
                            cy: ''
                        }),
                        fields: [
                            fields.bankAccountName,
                            fields.bankSortCode,
                            fields.bankAccountNumber,
                            fields.buildingSocietyNumber
                        ]
                    }
                ],
                preFlightCheck() {
                    const sortCode = get('bankSortCode')(data);
                    const accountNumber = get('bankAccountNumber')(data);

                    return new Promise((resolve, reject) => {
                        /**
                         * Bail early if we're testing and won't make this lookup
                         */
                        if (!!process.env.TEST_SERVER === true) {
                            return resolve();
                        } else {
                            checkBankAccountDetails(sortCode, accountNumber)
                                .then(bankStatus => {
                                    /**
                                     * If this API does anything weird, assume all is well
                                     * We treat this as a success in order to keep the form usable
                                     * if the third party API is down/broken
                                     */
                                    if (bankStatus.code === 'UNKNOWN') {
                                        const loggerMeta = {
                                            resultCode: bankStatus.originalCode
                                        };

                                        logger.info(
                                            'User bank details check: API call failed',
                                            loggerMeta
                                        );

                                        return resolve();
                                    } else if (bankStatus.code === 'INVALID') {
                                        return reject([
                                            {
                                                msg: localise({
                                                    en: `This sort code is not valid with this account number`,
                                                    cy: ''
                                                }),
                                                param: 'bankSortCode',
                                                field: fields.bankSortCode
                                            },
                                            {
                                                msg: localise({
                                                    en: `This account number is not valid with this sort code`,
                                                    cy: ''
                                                }),
                                                param: 'bankAccountNumber',
                                                field: fields.bankAccountNumber
                                            }
                                        ]);
                                    } else if (
                                        !bankStatus.supportsBacsPayment
                                    ) {
                                        return reject([
                                            {
                                                msg: localise({
                                                    en: `This bank account cannot receive BACS payments, which is a requirement for funding`,
                                                    cy: ''
                                                }),
                                                param: 'bankAccountNumber'
                                            }
                                        ]);
                                    } else {
                                        return resolve();
                                    }
                                })
                                .catch(err => {
                                    /**
                                     * We treat this as a success in order to keep the form usable
                                     * if the third party API is down/broken
                                     */
                                    Sentry.captureException(err);
                                    return resolve();
                                });
                        }
                    });
                }
            },
            {
                title: localise({ en: 'Bank statement', cy: '' }),
                isMultipart: true,
                fieldsets: [
                    {
                        legend: localise({ en: 'Bank statement', cy: '' }),
                        introduction: localise({
                            en: `
    
    <p><strong>You must attach your bank statement as a PDF, JPEG or PNG file. Unfortunately we can’t accept Word documents, but photos of your bank statements are absolutely fine.</strong></p>
    
    <aside class="o-media u-padded u-tone-background-tint u-margin-bottom">
        <a href="../help/bank-statement" target="_blank">
            <img src="/assets/images/apply/afa-bank-statement-example-small.png"
                 alt="An example of a bank statement we need from you"
                 class="o-media__figure-gutter"
                 width="300" />
            <span class="u-visually-hidden">Opens in a new window</span>
         </a>
        <div class="o-media__body">
            <p><strong>Please make sure that we can clearly see the following on your bank statement:</strong></p>
            <ul>
                <li>Your organisation’s legal name</li>
                <li>The address the statements are sent to</li>
                <li>The bank name</li>
                <li>Account number</li>
                <li>Sort code</li>
                <li>Date (must be within last 3 months)</li>
            </ul>
            <p>Here's an <a target="_blank" href="../help/bank-statement">example of what we're looking for</a><span class="u-visually-hidden"> Opens in a new window</span>.</p>
        </div>
    </aside>

    <p><strong>Your statement needs to be less than three months old</strong>. For bank accounts opened within the last three months, we can accept a bank welcome letter. This must confirm the date your account was opened, account name, account number and sort code.</p>
    
    <p><strong>If you're a school using a local authority bank account</strong></p>
    <p>We'll need a letter from the local authority dated within the last 3 months. It should show:</p> 
    <ul>
        <li>Your school name</li>
        <li>The bank account name</li>
        <li>Account number</li>
        <li>Sort code.</li>
    </ul>
                        `,
                            cy: ''
                        }),
                        fields: [fields.bankStatement]
                    }
                ]
            }
        ]
    };

    const sectionTerms = {
        slug: 'terms-and-conditions',
        title: localise({ en: 'Terms and conditions', cy: '' }),
        summary: localise({
            en: `In order to submit your application, you will need to agree to our terms and conditions.`,
            cy: ''
        }),
        steps: [
            {
                title: localise({
                    en: 'Terms and conditions of your grant',
                    cy: ''
                }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Terms and conditions of your grant',
                            cy: ''
                        }),
                        introduction: localise(termsCopy.introduction),
                        footer: localise(termsCopy.footer),
                        fields: [
                            fields.termsAgreement1,
                            fields.termsAgreement2,
                            fields.termsAgreement3,
                            fields.termsAgreement4,
                            fields.termsPersonName,
                            fields.termsPersonPosition
                        ]
                    }
                ]
            }
        ]
    };

    function summary() {
        const projectDateRange = get('projectDateRange')(data);
        const organisation = get('organisationLegalName')(data);
        const budget = getOr([], 'projectBudget')(data);
        const budgetSum = sumBy(budget, item => parseInt(item.cost || 0));

        return {
            title: get('projectName')(data),
            country: get('projectCountry')(data),
            overview: [
                {
                    label: localise({ en: 'Organisation', cy: '' }),
                    value: organisation
                },
                {
                    label: localise({ en: 'Project dates', cy: '' }),
                    value: projectDateRange && formatDateRange(projectDateRange)
                },
                {
                    label: localise({ en: 'Requested amount', cy: '' }),
                    value: budget.length > 0 && `£${budgetSum.toLocaleString()}`
                }
            ]
        };
    }

    function forSalesforce() {
        function dateFormat(dt) {
            return fromDateParts(dt).format('YYYY-MM-DD');
        }

        const enriched = clone(data);

        enriched.projectDateRange = {
            startDate: dateFormat(enriched.projectDateRange.startDate),
            endDate: dateFormat(enriched.projectDateRange.endDate)
        };

        if (has('mainContactDateOfBirth')(enriched)) {
            enriched.mainContactDateOfBirth = dateFormat(
                enriched.mainContactDateOfBirth
            );
        }

        if (has('seniorContactDateOfBirth')(enriched)) {
            enriched.seniorContactDateOfBirth = dateFormat(
                enriched.seniorContactDateOfBirth
            );
        }

        return enriched;
    }

    return new FormModel(
        {
            title: localise({
                en: 'National Lottery Awards for All',
                cy: ''
            }),
            isBilingual: true,
            allFields: fields,
            featuredErrorsAllowList: [
                { param: 'projectDateRange', includeBaseError: false },
                { param: 'seniorContactRole', includeBaseError: false },
                { param: 'mainContactName', includeBaseError: false },
                { param: 'mainContactEmail', includeBaseError: false },
                { param: 'mainContactPhone', includeBaseError: false }
            ],
            summary: summary(),
            forSalesforce: forSalesforce,
            sections: [
                sectionProject,
                sectionBeneficiaries(),
                sectionOrganisation,
                sectionSeniorContact,
                sectionMainContact,
                sectionBankDetails,
                sectionTerms
            ]
        },
        data
    );
};
