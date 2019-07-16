'use strict';
const Sentry = require('@sentry/node');
const clone = require('lodash/clone');
const compact = require('lodash/compact');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const has = require('lodash/fp/has');
const sumBy = require('lodash/sumBy');
const { safeHtml, oneLine } = require('common-tags');

const { FormModel } = require('../form-router-next/lib/form-model');
const { fromDateParts } = require('../form-router-next/lib/date-parts');
const { formatDateRange } = require('../form-router-next/lib/formatters');
const { BENEFICIARY_GROUPS, ORGANISATION_TYPES } = require('./constants');

const fieldsFor = require('./fields');
const terms = require('./terms');

const { isTestServer } = require('../../../common/appData');
const checkBankApi = require('../../../common/bank-api');

module.exports = function({ locale, data = {}, showAllFields = false }) {
    const localise = get(locale);

    const conditionalFields = (fields, filteredFields) => {
        const filteredFieldNames = filteredFields.map(_ => _.name);
        const allFields = fields.map(f => {
            if (filteredFieldNames.indexOf(f.name) === -1) {
                f.isConditional = true;
            }
            return f;
        });

        return showAllFields ? fields : filteredFields;
    };

    const currentOrganisationType = get('organisationType')(data);

    const fields = fieldsFor({
        locale: locale,
        data: data
    });

    function stepProjectDetails() {
        return {
            title: localise({ en: 'Project details', cy: '' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Project details', cy: '' }),
                    fields: [fields.projectName, fields.projectDateRange]
                }
            ]
        };
    }

    function stepProjectCountry() {
        /**
         * We are rolling out this form on a per-country basis
         * so we need to show a message to direct applicants to the old form
         * if they are applying for a country we don't support yet
         */
        const countryNoticeMessage = {
            title: localise({
                en: `Applying for a project in England, Northern Ireland or Wales?`,
                cy: ``
            }),
            body: localise({
                en: `<a href="https://apply.tnlcommunityfund.org.uk">
                    You’ll need to use this form instead
                </a>.
                Only applicants in Scotland can apply through our new online form at the moment.
                We’re working on making this available for the rest of the UK.`,
                cy: ``
            })
        };

        return {
            title: localise({ en: 'Project country', cy: '' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Project country', cy: '' }),
                    fields: [fields.projectCountry]
                }
            ],
            message: countryNoticeMessage
        };
    }

    function stepProjectLocation() {
        return {
            title: localise({ en: 'Project location', cy: '' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Project location', cy: '' }),

                    /**
                     * The project location fields are conditional based
                     * on the project country, so don't include them if
                     * the country hasn't been provided yet.
                     */
                    get fields() {
                        const allFields = [
                            fields.projectLocation,
                            fields.projectLocationDescription,
                            fields.projectPostcode
                        ];
                        return conditionalFields(
                            allFields,
                            has('projectCountry')(data) ? allFields : []
                        );
                    }
                }
            ]
        };
    }

    function stepYourIdea() {
        return {
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
        };
    }

    function stepProjectCosts() {
        return {
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
        };
    }

    function stepBeneficiariesCheck() {
        return {
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
                        en: `<p>
                            We want to hear more about the people who will benefit from your project.
                        </p>
                        <p>
                            It's important to be as accurate as possible in your answers.
                            We'll use this information to make better decisions about how
                            our funding supports people and communities to thrive.
                            We'll also use it to tell people about the impact of
                            our funding and who it is reaching.
                        </p>
                        <p>
                            However, the information you provide here is <strong>not assessed</strong>
                            and <strong>will not</strong> be used to decide whether you will be
                            awarded funding for your project.
                        </p>`,
                        cy: ``
                    }),
                    fields: [fields.beneficiariesGroupsCheck]
                }
            ]
        };
    }

    function stepBeneficiariesGroups() {
        const groupsCheck = get('beneficiariesGroupsCheck')(data);
        return {
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
                    get fields() {
                        const allFields = [
                            fields.beneficiariesGroups,
                            fields.beneficiariesGroupsOther
                        ];
                        return conditionalFields(
                            allFields,
                            compact([
                                groupsCheck === 'yes' &&
                                    fields.beneficiariesGroups,
                                groupsCheck === 'yes' &&
                                    fields.beneficiariesGroupsOther
                            ])
                        );
                    }
                }
            ]
        };
    }

    /**
     * Include fields based on the beneficiary groups selected.
     * Used to conditionally render fields for age, gender etc.
     */
    function includeIfBeneficiaryType(type, fields) {
        const groupChoices = getOr([], 'beneficiariesGroups')(data);
        return groupChoices.includes(type) ? fields : [];
    }

    function stepEthnicBackground() {
        return {
            title: localise({ en: 'Ethnic background', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Ethnic background',
                        cy: ''
                    }),
                    fields: conditionalFields(
                        [fields.beneficiariesEthnicBackground],
                        includeIfBeneficiaryType(
                            BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                            [fields.beneficiariesEthnicBackground]
                        )
                    )
                }
            ]
        };
    }

    function stepGender() {
        return {
            title: localise({ en: 'Gender', cy: '' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Gender', cy: '' }),
                    fields: conditionalFields(
                        [fields.beneficiariesGroupsGender],
                        includeIfBeneficiaryType(BENEFICIARY_GROUPS.GENDER, [
                            fields.beneficiariesGroupsGender
                        ])
                    )
                }
            ]
        };
    }

    function stepAge() {
        return {
            title: localise({ en: 'Age', cy: '' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Age', cy: '' }),
                    fields: conditionalFields(
                        [fields.beneficiariesGroupsAge],
                        includeIfBeneficiaryType(BENEFICIARY_GROUPS.AGE, [
                            fields.beneficiariesGroupsAge
                        ])
                    )
                }
            ]
        };
    }

    function stepDisabledPeople() {
        return {
            title: localise({ en: 'Disabled people', cy: '' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Disabled people', cy: '' }),
                    fields: conditionalFields(
                        [fields.beneficiariesGroupsDisabledPeople],
                        includeIfBeneficiaryType(
                            BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                            [fields.beneficiariesGroupsDisabledPeople]
                        )
                    )
                }
            ]
        };
    }

    function stepReligionOrFaith() {
        return {
            title: localise({ en: 'Religion or belief', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Religion or belief',
                        cy: ''
                    }),
                    get fields() {
                        const allFields = [
                            fields.beneficiariesGroupsReligion,
                            fields.beneficiariesGroupsReligionOther
                        ];
                        return conditionalFields(
                            allFields,
                            includeIfBeneficiaryType(
                                BENEFICIARY_GROUPS.RELIGION,
                                allFields
                            )
                        );
                    }
                }
            ]
        };
    }

    /**
     * Include fields based on the current country.
     */
    function includeIfCountry(country, fields) {
        const currentCountry = get('projectCountry')(data);
        return currentCountry === country ? fields : [];
    }

    function stepWelshLanguage() {
        return {
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
                    fields: conditionalFields(
                        [fields.beneficiariesWelshLanguage],
                        includeIfCountry('wales', [
                            fields.beneficiariesWelshLanguage
                        ])
                    )
                }
            ]
        };
    }

    function stepNorthernIrelandCommunity() {
        return {
            title: localise({ en: `Community`, cy: `` }),
            fieldsets: [
                {
                    legend: localise({ en: `Community`, cy: `` }),
                    fields: conditionalFields(
                        [fields.beneficiariesNorthernIrelandCommunity],
                        includeIfCountry('northern-ireland', [
                            fields.beneficiariesNorthernIrelandCommunity
                        ])
                    )
                }
            ]
        };
    }

    function stepOrganisationDetails() {
        return {
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
        };
    }

    function stepOrganisationType() {
        return {
            title: localise({ en: 'Organisation type', cy: '' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Organisation type', cy: '' }),
                    fields: [fields.organisationType]
                }
            ]
        };
    }

    /**
     * Include fields based on the current organisation type.
     */
    function includeIfOrganisationType(type, fields) {
        const organisationType = get('organisationType')(data);
        return organisationType === type ? fields : [];
    }

    /**
     * Conditional sub-type based on the primary organisation type.
     * Currently this is only required for statutory bodies.
     *
     * A fallback step title is provided for display on the summary
     * when the primary organisation type hasn't been provided yet.
     * i.e. for new applications
     */
    function stepOrganisationSubType() {
        let title = localise({
            en: 'Organisation sub-type',
            cy: ''
        });

        if (currentOrganisationType === ORGANISATION_TYPES.STATUTORY_BODY) {
            title = localise({
                en: 'Type of statutory body',
                cy: ''
            });
        }

        return {
            title: title,
            fieldsets: [
                {
                    legend: title,
                    fields: conditionalFields(
                        [fields.organisationSubTypeStatutoryBody],
                        includeIfOrganisationType(
                            ORGANISATION_TYPES.STATUTORY_BODY,
                            [fields.organisationSubTypeStatutoryBody]
                        )
                    )
                }
            ]
        };
    }

    /**
     * Registration numbers are conditional based on the organisation type
     * This step can include a combination of company number,
     * charity number, and/or department for education number.
     */
    function stepRegistrationNumbers() {
        const includeCompanyNumber = [
            ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
        ].includes(currentOrganisationType);

        const includeCharityNumber = [
            ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
            ORGANISATION_TYPES.CIO,
            ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
            ORGANISATION_TYPES.FAITH_GROUP
        ].includes(currentOrganisationType);

        const includeEducationNumber = [
            ORGANISATION_TYPES.SCHOOL,
            ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY
        ].includes(currentOrganisationType);

        return {
            title: localise({ en: 'Registration numbers', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Registration numbers',
                        cy: ''
                    }),
                    get fields() {
                        const allFields = [
                            fields.companyNumber,
                            fields.charityNumber,
                            fields.educationNumber
                        ];
                        return conditionalFields(
                            allFields,
                            compact([
                                includeCompanyNumber && fields.companyNumber,
                                includeCharityNumber && fields.charityNumber,
                                includeEducationNumber && fields.educationNumber
                            ])
                        );
                    }
                }
            ]
        };
    }

    /**
     * Conditionally include organisation finance questions based
     * on the organisation start date. New organisations will not have
     * produced annual accounts yet so will not have this information.
     */
    function stepOrganisationFinances() {
        const includeAccountDetails =
            get('organisationStartDate.isBeforeMin')(data) === true;

        return {
            title: localise({ en: 'Organisation finances', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Organisation finances',
                        cy: ''
                    }),
                    get fields() {
                        const allFields = [
                            fields.accountingYearDate,
                            fields.totalIncomeYear
                        ];
                        return conditionalFields(
                            allFields,
                            includeAccountDetails ? allFields : []
                        );
                    }
                }
            ]
        };
    }

    /**
     * Determine if we should ask for address and date of birth information.
     * For data protection reasons we should not request address information
     * for the organisation types listed here.
     */
    function includeAddressAndDob() {
        return ![
            ORGANISATION_TYPES.SCHOOL,
            ORGANISATION_TYPES.COLLEGE_OR_UNIVERSITY,
            ORGANISATION_TYPES.STATUTORY_BODY
        ].includes(currentOrganisationType);
    }

    function stepSeniorContact() {
        return {
            title: localise({ en: 'Senior contact', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Who is your senior contact?',
                        cy: ''
                    }),
                    introduction: localise({
                        en: `
                        <p>
                            Please give us the contact details of a senior member of your organisation.
                        </p>
                        <p>
                            Your senior contact must be at least 18 years old and is legally responsible
                            for ensuring that this application is supported by the organisation applying,
                            any funding is delivered as set out in the application form, and that the
                            funded organisation meets our monitoring requirements.
                        </p>`,
                        cy: ``
                    }),
                    get fields() {
                        const allFields = [
                            fields.seniorContactRole,
                            fields.seniorContactName,
                            fields.seniorContactDateOfBirth,
                            fields.seniorContactAddress,
                            fields.seniorContactAddressHistory,
                            fields.seniorContactEmail,
                            fields.seniorContactPhone,
                            fields.seniorContactCommunicationNeeds
                        ];
                        const filteredFields = compact([
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
                        ]);
                        return conditionalFields(allFields, filteredFields);
                    }
                }
            ]
        };
    }

    function stepMainContact() {
        return {
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
                        const seniorSurname = get('seniorContactName.lastName')(
                            data
                        );
                        const seniorName =
                            seniorFirstName && seniorSurname
                                ? `, ${seniorFirstName} ${seniorSurname}`
                                : '';

                        return localise({
                            en: safeHtml`<p>
                                Please give us the contact details of a person
                                we can get in touch with if we have any questions.
                                The main contact is usually the person filling in
                                the form—so it's probably you. The main contact needs
                                to be from the organisation applying, but they don't
                                need to hold a particular position.    
                            </p>
                            <p>
                                The main contact must be a different person from
                                the senior contact${seniorName}. The two contacts
                                also can't be married or in a long-term relationship
                                with each other, living together at the same address,
                                or related by blood.
                            </p>`,
                            cy: ''
                        });
                    },
                    get fields() {
                        const allFields = [
                            fields.mainContactName,
                            fields.mainContactDateOfBirth,
                            fields.mainContactAddress,
                            fields.mainContactAddressHistory,
                            fields.mainContactEmail,
                            fields.mainContactPhone,
                            fields.mainContactCommunicationNeeds
                        ];
                        return conditionalFields(
                            allFields,
                            compact([
                                fields.mainContactName,
                                includeAddressAndDob() &&
                                    fields.mainContactDateOfBirth,
                                includeAddressAndDob() &&
                                    fields.mainContactAddress,
                                includeAddressAndDob() &&
                                    fields.mainContactAddressHistory,
                                fields.mainContactEmail,
                                fields.mainContactPhone,
                                fields.mainContactCommunicationNeeds
                            ])
                        );
                    }
                }
            ]
        };
    }

    /**
     * Bank account details pre-flight check
     * Returns a list of error messages if the bank details are invalid
     *
     * Wraps result in a promise so we can resolve if the API
     * returns an unknown status or an error.
     *
     * We can treat this check as optional as it is performed again
     * at the CRM end and we want to keep the form usable if
     * if the third party API is down/broken.
     *
     * Bails early if we're in a test server to avoid extra lookups.
     */
    function bankAccountPreFlightCheck() {
        const sortCode = get('bankSortCode')(data);
        const accountNumber = get('bankAccountNumber')(data);

        function messagesForStatus(bankStatus) {
            let messages = [];
            if (bankStatus.code === 'INVALID') {
                messages = [
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
                ];
            } else if (bankStatus.supportsBacsPayment === false) {
                messages = [
                    {
                        msg: localise({
                            en: oneLine`This bank account cannot receive BACS payments,
                                which is a requirement for funding`,
                            cy: ''
                        }),
                        param: 'bankAccountNumber',
                        field: fields.bankAccountNumber
                    }
                ];
            }
            return messages;
        }

        if (isTestServer) {
            return Promise.resolve();
        } else {
            return new Promise((resolve, reject) => {
                checkBankApi(sortCode, accountNumber)
                    .then(bankStatus => {
                        const messages = messagesForStatus(bankStatus);

                        if (messages.length > 0) {
                            return reject(messages);
                        } else {
                            return resolve();
                        }
                    })
                    .catch(err => {
                        Sentry.captureException(err);
                        return resolve();
                    });
            });
        }
    }

    function stepBankAccount() {
        return {
            title: localise({ en: 'Bank account', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'What are your bank account details?',
                        cy: ''
                    }),
                    introduction: localise({
                        en: `<p>
                            This should be the legal name of your organisation as it
                            appears on your bank statement—not the name of your bank.
                            This will usually be the same as your organisation’s
                            name on your governing document.
                        </p>
                        <p>
                            <strong>The kinds of bank accounts we don't accept</strong>:
                            We can't transfer money into certain types of bank
                            accounts like Tide, Cashplus and Paypal.
                        </p>`,
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
            preFlightCheck: bankAccountPreFlightCheck
        };
    }

    function stepBankStatement() {
        const introduction = localise({
            en: `
            <p><strong>
                You must attach your bank statement as a PDF, JPEG or PNG file.
                Unfortunately we can’t accept Word documents,
                but photos of your bank statements are absolutely fine.
            </strong></p>
            
            <div class="o-media u-padded u-tone-background-tint u-margin-bottom">
                <a href="../help/bank-statement" target="_blank">
                    <img src="/assets/images/apply/afa-bank-statement-example-small.png"
                         alt="An example of a bank statement we need from you"
                         class="o-media__figure-gutter"
                         width="300" />
                    <span class="u-visually-hidden">Opens in a new window</span>
                 </a>
                <div class="o-media__body">
                    <p><strong>
                        Please make sure that we can clearly see the
                        following on your bank statement:
                    </strong></p>
                    <ul>
                        <li>Your organisation’s legal name</li>
                        <li>The address the statements are sent to</li>
                        <li>The bank name</li>
                        <li>Account number</li>
                        <li>Sort code</li>
                        <li>Date (must be within last 3 months)</li>
                    </ul>
                    <p>Here's an <a target="_blank" href="../help/bank-statement">
                        example of what we're looking for
                    </a>
                    <span class="u-visually-hidden"> Opens in a new window</span>.</p>
                </div>
            </div>
            <p>
                <strong>Your statement needs to be less than three months old</strong>.
                For bank accounts opened within the last three months,
                we can accept a bank welcome letter. This must confirm
                the date your account was opened, account name,
                account number and sort code.
            </p>
            <p><strong>If you're a school using a local authority bank account</strong></p>
            <p>
                We'll need a letter from the local authority dated
                within the last 3 months. It should show:
            </p> 
            <ul>
                <li>Your school name</li>
                <li>The bank account name</li>
                <li>Account number</li>
                <li>Sort code.</li>
            </ul>`,
            cy: ''
        });

        return {
            title: localise({ en: 'Bank statement', cy: '' }),
            isMultipart: true,
            fieldsets: [
                {
                    legend: localise({ en: 'Bank statement', cy: '' }),
                    introduction: introduction,
                    fields: [fields.bankStatement]
                }
            ]
        };
    }

    function stepTerms() {
        const footer = localise({
            en: `<p>
                We know the vast majority of the many thousands who
                seek and use our funding are genuine. However, we
                sometimes receive fraudulent applications and so we
                have a duty to carry out checks on individuals at
                organisations which apply for grants.
                The personal information we have collected from you
                will therefore be shared with fraud prevention
                agencies who will use it to prevent fraud and money-laundering
                and to verify your identity. If fraud is detected,
                you could be refused certain services, finance or employment.
            </p>
            <p>
                Further details of how your information will be used by us
                and these fraud prevention agencies, your data protection
                rights and how to contact us, can be found in our full
                Data Protection and Privacy Notice which is published on our website
                <a href="/data-protection">www.tnlcommunityfund.org.uk/data-protection</a>.
                Contact us to request a hard copy by telephoning our advice line on 0345 4 10 20 30,
                or by writing to Customer Services, The National Lottery Community Fund,
                2 St James’ Gate, Newcastle upon Tyne, NE1 4BE.
             </p>
             <p>When you click submit the Terms and Conditions as agreed to above become binding.</p>`,
            cy: ''
        });

        return {
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
                    introduction: `<ol class="o-nested-numbers">
                        ${localise(terms)
                            .map(
                                section => `<li>
                                    <p><strong>${section.title}</strong></p>
                                    <ol class="o-nested-numbers">
                                        ${section.clauses
                                            .map(clause => `<li>${clause}</li>`)
                                            .join('')}
                                    </ol>
                                </li>`
                            )
                            .join('')}
                    </ol>`,
                    footer: footer,
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
        };
    }

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

    const form = {
        title: localise({
            en: 'National Lottery Awards for All',
            cy: ''
        }),
        // @TODO: Re-enable when welsh translation has been added
        isBilingual: false,
        allFields: fields,
        featuredErrorsAllowList: [
            'projectDateRange',
            'seniorContactRole',
            'mainContactName',
            'mainContactEmail',
            'mainContactPhone'
        ],
        summary: summary(),
        forSalesforce: forSalesforce,
        sections: [
            {
                slug: 'your-project',
                title: localise({
                    en: 'Your project',
                    cy: '(WELSH) Your project'
                }),
                summary: localise({
                    en: oneLine`Please tell us about your project in this section.
                        This is the most important section when it comes to
                        making a decision about whether you will receive funding.`,
                    cy: ``
                }),
                steps: [
                    stepProjectDetails(),
                    stepProjectCountry(),
                    stepProjectLocation(),
                    stepYourIdea(),
                    stepProjectCosts()
                ]
            },
            {
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
                    stepBeneficiariesCheck(),
                    stepBeneficiariesGroups(),
                    stepEthnicBackground(),
                    stepGender(),
                    stepAge(),
                    stepDisabledPeople(),
                    stepReligionOrFaith(),
                    stepWelshLanguage(),
                    stepNorthernIrelandCommunity()
                ]
            },
            {
                slug: 'organisation',
                title: localise({ en: 'Your organisation', cy: '' }),
                summary: localise({
                    en: oneLine`Please tell us about your organisation,
                        including legal name, registered address and income.
                        This helps us understand the type of organisation you are.`,
                    cy: ''
                }),
                steps: [
                    stepOrganisationDetails(),
                    stepOrganisationType(),
                    stepOrganisationSubType(),
                    stepRegistrationNumbers(),
                    stepOrganisationFinances()
                ]
            },
            {
                slug: 'senior-contact',
                title: localise({ en: 'Senior contact', cy: '' }),
                summary: localise({
                    en: oneLine`Please provide details for your senior contact.
                        This person will be legally responsible for the funding.
                        They can't be married, in a long-term relationship,
                        living with, or related to the main contact.`,
                    cy: ``
                }),
                steps: [stepSeniorContact()]
            },
            {
                slug: 'main-contact',
                title: localise({ en: 'Main contact', cy: '' }),
                summary: localise({
                    en: oneLine`Please provide details for your main contact.
                        This will be the first person we contact if we
                        need to discuss your project.`,
                    cy: ``
                }),
                steps: [stepMainContact()]
            },
            {
                slug: 'bank-details',
                title: localise({ en: 'Bank details', cy: '' }),
                summary: localise({
                    en: oneLine`Please provide your bank details.
                        Before you submit your application you will
                        need to attach a copy of a bank statement
                        that is less than three months old`,
                    cy: ''
                }),
                steps: [stepBankAccount(), stepBankStatement()]
            },
            {
                slug: 'terms-and-conditions',
                title: localise({ en: 'Terms and conditions', cy: '' }),
                summary: localise({
                    en: oneLine`In order to submit your application,
                        you will need to agree to our terms and conditions.`,
                    cy: ''
                }),
                steps: [stepTerms()]
            }
        ]
    };

    return new FormModel(form, data);
};
