'use strict';
const Sentry = require('@sentry/node');
const clone = require('lodash/clone');
const concat = require('lodash/concat');
const compact = require('lodash/compact');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const has = require('lodash/fp/has');
const sumBy = require('lodash/sumBy');
const { safeHtml, oneLine } = require('common-tags');
const config = require('config');

const { FormModel } = require('../form-router-next/lib/form-model');
const { fromDateParts } = require('../form-router-next/lib/date-parts');
const { formatDateRange } = require('../form-router-next/lib/formatters');
const {
    BENEFICIARY_GROUPS,
    CONTACT_EXCLUDED_TYPES,
    ORGANISATION_TYPES,
    COMPANY_NUMBER_TYPES,
    CHARITY_NUMBER_TYPES,
    EDUCATION_NUMBER_TYPES
} = require('./constants');

const fieldsFor = require('./fields');
const terms = require('./terms');
const { getContactFullName } = require('./lib/contacts');

const { isTestServer } = require('../../../common/appData');
const { checkBankAccountDetails } = require('./lib/bank-api');

module.exports = function({
    locale = 'en',
    data = {},
    showAllFields = false
} = {}) {
    const localise = get(locale);

    const conditionalFields = (fields, filteredFields) => {
        const filteredFieldNames = filteredFields.map(_ => _.name);
        const allFields = compact(
            fields.map(f => {
                if (filteredFieldNames.indexOf(f.name) === -1) {
                    f.isConditional = true;
                }
                return f;
            })
        );

        return showAllFields ? allFields : filteredFields;
    };

    const currentOrganisationType = get('organisationType')(data);

    const fields = fieldsFor({
        locale: locale,
        data: data
    });

    function stepProjectDetails() {
        return {
            title: localise({ en: 'Project details', cy: 'Manylion prosiect' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Project details',
                        cy: 'Manylion prosiect'
                    }),
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
                en: `Applying for a project in England or Wales?`,
                cy: `Ymgeisio am brosiect yn Lloegr neu Gymru?`
            }),
            body: localise({
                en: `
                    <p><a href="https://apply.tnlcommunityfund.org.uk">You'll need to use this form instead</a>.</p>
                    <p><strong>Applying for a project in Northern Ireland?</strong></p>
                    <p><a href="/funding/programmes/awards-for-all-northern-ireland">You'll need to download an application form to apply</a>.</p>
                    <p>Only applicants in Scotland can apply through our new online form at the moment. We're working on making this available for the rest of the UK.</p>
                `,
                cy: `
                    <p><a href="https://apply.tnlcommunityfund.org.uk">Byddwch angen defnyddio’r ffurflen hon yn lle</a>.</p>
                    <p><strong>Ymgeisio am brosiect yng Ngogledd Iwerddon?</strong></p>
                    <p><a href="funding/programmes/awards-for-all-northern-ireland">Byddwch angen lawrlwytho ffurflen gais i ymgeisio</a>.</p>
                    <p>Ymgeiswyr yn Yr Alban yn unig gall ymgeisio drwy ein ffurlfen ar-lein newydd ar hyn o bryd. Rydym yn gweithio ar wneud hwn yn hygyrch i weddill Prydain.</p>
                `
            })
        };

        return {
            title: localise({ en: 'Project country', cy: 'Gwlad y prosiect' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Project country',
                        cy: 'Gwlad y prosiect'
                    }),
                    fields: [fields.projectCountry]
                }
            ],
            message: countryNoticeMessage
        };
    }

    function stepProjectLocation() {
        return {
            title: localise({
                en: 'Project location',
                cy: 'Lleoliad y prosiect'
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Project location',
                        cy: 'Lleoliad y prosiect'
                    }),

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
            title: localise({ en: 'Your idea', cy: 'Eich syniad' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Your idea',
                        cy: 'Eich syniad'
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
                cy: 'Costau’r prosiect'
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Project costs',
                        cy: 'Costau’r prosiect'
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
                cy: `Grwpiau penodol o bobl`
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: `Specific groups of people`,
                        cy: `Grwpiau penodol o bobl`
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
                        cy: `<p>
                            Rydym eisiau clywed mwy am y bobl a fydd yn elwa o’ch prosiect.
                        </p>
                        <p>
                            Mae’n bwysig bod mor gywir â phosibl gyda’ch atebion. 
                            Byddwn yn defnyddio’r wybodaeth hyn i wneud gwell benderfyniadau am 
                            sut mae ein hariannu yn cefnogi pobl a chymunedau i ffynnu. 
                            Byddwn hefyd yn ei ddefnyddio i ddweud wrth bobl am effaith 
                            ein hariannu a phwy mae’n ei gyrraedd.
                        </p>
                        <p>
                            Er hynny, <strong>nid</strong> yw’r wybodaeth rydych wedi’i ddarparu yma’n cael ei asesu 
                            a <strong>ni fydd</strong> yn cael ei ddefnyddio i benderfynu a fyddwch yn llwyddiannus yn eich cais.
                        </p>`
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
                cy: 'Grwpiau penodol o bobl'
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Specific groups of people',
                        cy: 'Grwpiau penodol o bobl'
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
        const groupChoices = get('beneficiariesGroups')(data) || [];
        return groupChoices.includes(type) ? fields : [];
    }

    function stepEthnicBackground() {
        return {
            title: localise({ en: 'Ethnic background', cy: 'Cefndir ethnig' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Ethnic background',
                        cy: 'Cefndir ethnig'
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
            title: localise({ en: 'Gender', cy: 'Rhyw' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Gender', cy: 'Rhyw' }),
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
            title: localise({ en: 'Age', cy: 'Oedran' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Age', cy: 'Oedran' }),
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
            title: localise({ en: 'Disabled people', cy: 'Pobl anabl' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Disabled people',
                        cy: 'Pobl anabl'
                    }),
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
            title: localise({
                en: 'Religion or belief',
                cy: 'Crefydd neu gred'
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Religion or belief',
                        cy: 'Crefydd neu gred'
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

    function isForCountry(country) {
        const currentCountry = get('projectCountry')(data);
        return currentCountry === country;
    }

    /**
     * Include fields based on the current country.
     */
    function includeIfCountry(country, fields) {
        return isForCountry(country) ? fields : [];
    }

    function stepWelshLanguage() {
        return {
            title: localise({
                en: `People who speak Welsh`,
                cy: `Pobl sy’n siarad Cymraeg`
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: `People who speak Welsh`,
                        cy: `Pobl sy’n siarad Cymraeg`
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
            title: localise({
                en: `Northern Ireland community`,
                cy: `Cymuned Gogledd Iwerddon`
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: `Northern Ireland community`,
                        cy: `Cymuned Gogledd Iwerddon`
                    }),
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
            title: localise({
                en: 'Organisation details',
                cy: 'Manylion sefydliad'
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Organisation details',
                        cy: 'Manylion sefydliad'
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
            title: localise({
                en: 'Organisation type',
                cy: 'Math o sefydliad'
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Organisation type',
                        cy: 'Math o sefydliad'
                    }),
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
            cy: 'Is-fath y sefydliad'
        });

        if (currentOrganisationType === ORGANISATION_TYPES.STATUTORY_BODY) {
            title = localise({
                en: 'Type of statutory body',
                cy: 'Math o gorff statudol'
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
        const includeCompanyNumber = COMPANY_NUMBER_TYPES.includes(
            currentOrganisationType
        );

        const includeCharityNumber = concat(
            CHARITY_NUMBER_TYPES.required,
            CHARITY_NUMBER_TYPES.optional
        ).includes(currentOrganisationType);

        const includeEducationNumber = EDUCATION_NUMBER_TYPES.includes(
            currentOrganisationType
        );

        return {
            title: localise({
                en: 'Registration numbers',
                cy: 'Rhifau cofrestru'
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Registration numbers',
                        cy: 'Rhifau cofrestru'
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
            title: localise({
                en: 'Organisation finances',
                cy: 'Cyllid y sefydliad'
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Organisation finances',
                        cy: 'Cyllid y sefydliad'
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
        return (
            CONTACT_EXCLUDED_TYPES.includes(currentOrganisationType) === false
        );
    }

    function stepSeniorContact() {
        return {
            title: localise({ en: 'Senior contact', cy: 'Uwch gyswllt' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Who is your senior contact?',
                        cy: 'Pwy yw eich uwch gyswllt?'
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
                        cy: `
                        <p>
                            Rhowch fanylion cyswllt uwch aelod o’ch sefydliad.
                        </p>
                        <p>
                            Rhaid i’ch uwch gyswllt fod dros 18 oed a’n gyfreithiol gyfrifol 
                            am sicrhau fod y cais hwn yn cael ei gefnogi gan y sefydliad sy’n ymgeisio, 
                            bod unrhyw arian yn cael ei ddarparu fel y gosodwyd yn y ffurflen gais, a bod y 
                            sefydliad a ariennir yn cwrdd â’n gofynion monitro.
                        </p>`
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
                            fields.seniorContactLanguagePreference,
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
                            isForCountry('wales') &&
                                fields.seniorContactLanguagePreference,
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
            title: localise({ en: 'Main contact', cy: 'Prif gyswllt' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Who is your main contact?',
                        cy: 'Pwy yw eich prif gyswllt?'
                    }),
                    get introduction() {
                        const seniorName = getContactFullName(
                            get('seniorContactName')(data)
                        );
                        const seniorNameMsg = seniorName
                            ? `, ${seniorName}`
                            : '';

                        return localise({
                            en:
                                safeHtml`<p>
                                Please give us the contact details of a person
                                we can get in touch with if we have any questions.
                                The main contact is usually the person filling in
                                the form—so it's probably you. The main contact needs
                                to be from the organisation applying, but they don't
                                need to hold a particular position.    
                            </p>
                            <p>
                                The main contact must be a different person from the senior contact` +
                                seniorNameMsg +
                                `. The two contacts also can't be:
                            </p>
                            <ul>                            
                                <li>married to each other</li>
                                <li>in a long-term relationship together</li>
                                <li>living at the same address</li>
                                <li>or related by blood.</li> 
                            </ul>
                            `,
                            cy:
                                safeHtml`<p>
                                Rhowch fanylion cyswllt y person gallwn gysylltu â nhw os 
                                oes gennym unrhyw gwestiynau. Y prif gyswllt fel arfer yw’r 
                                person sy’n llenwi’r ffurflen – felly mae’n debyg mai chi yw hwn. 
                                Mae’r prif gyswllt angen bod o’r sefydliad sy’n ymgeisio, ond nid 
                                oes rhaid iddynt ddal unrhyw safle penodol o fewn y sefydliad.    
                            </p>
                            <p>
                                Rhaid i’r prif gyswllt fod yn wahanol i’r uwch gyswllt` +
                                seniorNameMsg +
                                `. Ni all y ddau gyswllt hefyd fod:
                            </p>
                            <ul>                            
                                <li>yn briod i’w gilydd</li>
                                <li>mewn perthynas hir dymor a’u gilydd</li>
                                <li>yn byw yn yr un cyfeiriad</li>
                                <li>Neu yn perthyn drwy waed.</li>
                            </ul>
                            `
                        });
                    },
                    get fields() {
                        const showContactConfirmationQuestion = config.get(
                            'awardsForAll.showContactConfirmationQuestion'
                        );

                        const allFields = compact([
                            fields.mainContactName,
                            showContactConfirmationQuestion &&
                                fields.mainContactIsValid,
                            fields.mainContactDateOfBirth,
                            fields.mainContactAddress,
                            fields.mainContactAddressHistory,
                            fields.mainContactEmail,
                            fields.mainContactPhone,
                            fields.mainContactLanguagePreference,
                            fields.mainContactCommunicationNeeds
                        ]);

                        return conditionalFields(
                            allFields,
                            compact([
                                fields.mainContactName,
                                showContactConfirmationQuestion &&
                                    fields.mainContactIsValid,
                                includeAddressAndDob() &&
                                    fields.mainContactDateOfBirth,
                                includeAddressAndDob() &&
                                    fields.mainContactAddress,
                                includeAddressAndDob() &&
                                    fields.mainContactAddressHistory,
                                fields.mainContactEmail,
                                fields.mainContactPhone,
                                isForCountry('wales') &&
                                    fields.mainContactLanguagePreference,
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
            switch (bankStatus.code) {
                case 'INVALID_ACCOUNT':
                    messages = [
                        {
                            msg: localise({
                                en: `This sort code is not valid with this account number`,
                                cy:
                                    'Nid yw’r cod didoli’n ddilys â’r rhif cyfrif hwn'
                            }),
                            param: 'bankSortCode',
                            field: fields.bankSortCode
                        },
                        {
                            msg: localise({
                                en: `This account number is not valid with this sort code`,
                                cy:
                                    'Nid yw’r rhif cyfrif yn ddilys â’r cod didoli hwn'
                            }),
                            param: 'bankAccountNumber',
                            field: fields.bankAccountNumber
                        }
                    ];
                    break;
                case 'INVALID_BACS':
                    messages = [
                        {
                            msg: localise({
                                en: oneLine`This bank account cannot receive BACS payments,
                                    which is a requirement for funding`,
                                cy: oneLine`Ni all y cyfrif banc hwn dderbyn taliadau BACS, 
                                    sy’n ofynnol i gael eich ariannu.`
                            }),
                            param: 'bankAccountNumber',
                            field: fields.bankAccountNumber
                        }
                    ];
                    break;
                default:
                    messages = [];
                    break;
            }

            return messages;
        }

        if (isTestServer) {
            return Promise.resolve();
        } else {
            return new Promise((resolve, reject) => {
                checkBankAccountDetails(sortCode, accountNumber)
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
            title: localise({ en: 'Bank account', cy: 'Cyfrif banc' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'What are your bank account details?',
                        cy: 'Beth yw eich manylion cyfrif banc?'
                    }),
                    introduction: localise({
                        en: `<p>
                            We need your bank details to pay the funding into your account - if your application is successful. 
                        </p>
                        <p><strong>We can't pay into all bank accounts</strong>:
                            We can't transfer money into certain types of bank
                            accounts like Tide, Cashplus and Paypal.
                        </p>`,
                        cy: `<p>
                            Rydym angen eich manylion banc i dalu’r arian i’ch cyfrif – os yw eich cais yn llwyddiannus. 
                        </p>
                        <p><strong>Ni allwn dalu i mewn i bob cyfrif banc</strong>:
                            Ni allwn drosglwyddo arian i fathau penodol o gyfrifon fel Tide, Cashplush a Paypal.
                        </p>`
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
            cy: `
            <p><strong>
                Rhaid ichi atodi eich cyfriflen banc fel ffeil PDF, JPEG neu PNG. 
                Yn anffodus, ni allwn dderbyn dogfennau Word, 
                ond mae lluniau o’ch cyfriflenni banc yn hollol iawn.
            </strong></p>
            
            <div class="o-media u-padded u-tone-background-tint u-margin-bottom">
                <a href="../help/bank-statement" target="_blank">
                    <img src="/assets/images/apply/afa-bank-statement-example-small.png"
                         alt="Enghraifft o gyfriflen banc rydym ei angen gennych"
                         class="o-media__figure-gutter"
                         width="300" />
                    <span class="u-visually-hidden">Yn agor mewn ffenest newydd</span>
                 </a>
                <div class="o-media__body">
                    <p><strong>
                        Sicrhewch fod y canlynol yn glir ar eich cyfriflen banc:
                    </strong></p>
                    <ul>
                        <li>Enw cyfreithiol eich sefydliad</li>
                        <li>Y cyfeiriad mae’r cyfriflenni’n cael eu hanfon</li>
                        <li>Enw’r banc</li>
                        <li>Rhif cyfrif</li>
                        <li>Cod didoli</li>
                        <li>Dyddiad (Rhaid bod o fewn y tair mis diwethaf)</li>
                    </ul>
                    <p>Dyma <a target="_blank" href="../help/bank-statement">
                        enghraifft o’r hyn rydym yn edrych amdano
                    </a>
                    <span class="u-visually-hidden"> Yn agor mewn ffenest newydd</span>.</p>
                </div>
            </div>
            <p>
                <strong>Rhaid i’ch cyfriflen fod yn llai na tair mis oed</strong>.
                I gyfrifon banc sydd wedi agor o fewn y tair mis diwethaf, 
                gallwn dderbyn llythyr o groeso gan y banc. Rhaid i hwn gadarhau’r 
                dyddiad roedd eich cyfrif wedi’i agor, 
                enw’r cyfrif, rhif y cyfrif a’r cod didoli.
            </p>
            <p><strong>Os ydych yn ysgol yn defnyddio cyfrif banc awdurdod lleol</strong></p>
            <p>
                Byddwn angen llythyr gan yr awdurdod lleol wedi’i ddyddio o fewn y tair mis ddiwethaf. Dylai ddangos:
            </p> 
            <ul>
                <li>Enw eich ysgol</li>
                <li>Enw’r cyfrif banc</li>
                <li>Rhif cyfrif</li>
                <li>Cod didoli</li>
            </ul>`
        });

        return {
            title: localise({ en: 'Bank statement', cy: 'Cyfriflen banc' }),
            isMultipart: true,
            fieldsets: [
                {
                    legend: localise({
                        en: 'Bank statement',
                        cy: 'Cyfriflen banc'
                    }),
                    introduction: introduction,
                    fields: [fields.bankStatement]
                }
            ]
        };
    }

    function stepTerms() {
        const title = localise({
            en: 'Terms and conditions of your grant',
            cy: 'Telerau ac Amodau eich grant'
        });

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
            cy: `<p>
                Rydym yn gwybod bod y rhan fwyaf o’r miloedd sy’n 
                chwilio am arian gennym yn ddiffuant. Er hynny, rydym 
                weithiau yn derbyn ceisiadau twyllodrus ac felly mae gennym 
                ddyletswydd i wneud gwiriadau ar unigolion mewn sefydliadau 
                sy’n ymgeisio am grantiau. Bydd y wybodaeth bersonol rydym wedi’i 
                gasglu gennych felly yn cael ei rannu gydag asiantaethau atal twyll, 
                a fydd yn ei ddefnyddio i atal twyll a gwyngalchu arian, 
                ac i wireddu eich hunaniaeth. Os oes twyll yn cael ei ganfod, 
                gellid eich gwrthod rhag rhai gwasanaethau, arian neu gyflogaeth.
            </p>
            <p>
                Gall gwybodaeth pellach ar sut bydd eich gwybodaeth yn cael ei ddefnyddio gennym a’r 
                asiantaethau atal twyll hyn, eich hawliau gwarchod data a sut i gysylltu â ni, ei ganfod yn ein 
                Hysbysiad Diogelu Data a Phreifatrwydd llawn, sydd wedi’i gyhoeddi ar ein gwefan 
                <a href="/welsh/about/customer-service/data-protection">https://www.tnlcommunityfund.org.uk/welsh/about/customer-service/data-protection</a>. 
                Cysylltwch â ni i ofyn am gopi caled drwy ffonio ein llinell gynghori ar 0345 4 10 20 30, 
                neu drwy ysgrifennu i Customer Services, The National Lottery Community Fund, 
                2 St James’ Gate, Newcastle upon Tyne, NE1 4BE.
            </p>
            <p>Pan fyddwch yn clicio anfon, mae’r Telerau ac Amodau fel y cytunwyd uchod yn dod yn rhwymol.</p>`
        });

        return {
            title: title,
            fieldsets: [
                {
                    legend: title,
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
                    label: localise({ en: 'Organisation', cy: 'Sefydliad' }),
                    value: organisation
                },
                {
                    label: localise({
                        en: 'Project dates',
                        cy: 'Dyddiadau’r prosiect'
                    }),
                    value: projectDateRange && formatDateRange(projectDateRange)
                },
                {
                    label: localise({
                        en: 'Requested amount',
                        cy: 'Swm y gofynnwyd amdano'
                    }),
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
            cy: 'Arian i Bawb y Loteri Genedlaethol'
        }),
        allFields: fields,
        featuredErrorsAllowList: [
            'projectDateRange',
            'seniorContactRole',
            'mainContactName',
            'mainContactEmail',
            'mainContactPhone'
        ],
        summary: summary(),
        schemaVersion: 'v1.0',
        forSalesforce: forSalesforce,
        sections: [
            {
                slug: 'your-project',
                title: localise({
                    en: 'Your project',
                    cy: 'Eich prosiect'
                }),
                summary: localise({
                    en: oneLine`Please tell us about your project in this section.
                        This is the most important section when it comes to
                        making a decision about whether you will receive funding.`,
                    cy: oneLine`Dywedwch wrthym am eich prosiect yn yr adran hon. 
                        Dyma’r adran bwysicaf pan fydd yn dod i wneud penderfyniad p’un 
                        a ydych wedi bod yn llwyddiannus ai beidio.`
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
                    cy: 'Pwy fydd yn elwa o’ch prosiect?'
                }),
                shortTitle: localise({
                    en: 'Who will benefit',
                    cy: 'Pwy fydd yn elwa'
                }),
                summary: localise({
                    en: `We want to hear more about the people who will benefit from your project.`,
                    cy: `Rydym eisiau clywed mwy am y bobl a fydd yn elwa o’ch prosiect.`
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
                title: localise({
                    en: 'Your organisation',
                    cy: 'Eich sefydliad'
                }),
                summary: localise({
                    en: oneLine`Please tell us about your organisation,
                        including legal name, registered address and income.
                        This helps us understand the type of organisation you are.`,
                    cy: oneLine`Dywedwch wrthym am eich sefydliad, gan gynnwys yr enw cyfreithiol, 
                        cyfeiriad cofrestredig ac incwm. Mae hyn yn ein helpu 
                        i ddeall pa fath o sefydliad ydych.`
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
                title: localise({ en: 'Senior contact', cy: 'Uwch gyswllt' }),
                summary: localise({
                    en: oneLine`Please provide details for your senior contact.
                        This person will be legally responsible for the funding.
                        They can't be married to, in a long-term relationship with,
                        living with, or related to the main contact.`,
                    cy: oneLine`Darparwch fanylion ar gyfer eich uwch gyswllt. 
                        Bydd y person yma’n gyfreithiol gyfrifol am yr arian. 
                        Ni allent fod yn briod i, mewn perthynas hir dymor â, 
                        yn byw gyda na’n perthyn drwy waed i’r prif gyswllt.`
                }),
                steps: [stepSeniorContact()]
            },
            {
                slug: 'main-contact',
                title: localise({ en: 'Main contact', cy: 'Prif gyswllt' }),
                summary: localise({
                    en: oneLine`Please provide details for your main contact.
                        This will be the first person we contact if we
                        need to discuss your project.`,
                    cy: oneLine`Darparwch fanylion ar gyfer eich prif gyswllt. 
                        Dyma fydd y person cyntaf i ni gysylltu â nhw os 
                        byddwn angen trafod eich prosiect.`
                }),
                steps: [stepMainContact()]
            },
            {
                slug: 'bank-details',
                title: localise({ en: 'Bank details', cy: 'Manylion banc' }),
                summary: localise({
                    en: oneLine`Please provide your bank details.
                        Before you submit your application you will
                        need to attach a copy of a bank statement
                        that is less than three months old`,
                    cy: oneLine`Darparwch eich manylion banc. 
                        Cyn i chi anfon eich cais bydd angen i chi 
                        atodi copi o’ch cyfriflen banc sy’n 
                        llai na tair mis oed.`
                }),
                steps: [stepBankAccount(), stepBankStatement()]
            },
            {
                slug: 'terms-and-conditions',
                title: localise({
                    en: 'Terms and conditions',
                    cy: 'Telerau ac Amodau'
                }),
                summary: localise({
                    en: oneLine`In order to submit your application,
                        you will need to agree to our terms and conditions.`,
                    cy: oneLine`Er mwyn anfon eich cais, 
                        bydd angen i chi gytuno a’n Telerau ac Amodau.`
                }),
                steps: [stepTerms()]
            }
        ]
    };

    return new FormModel(form, data);
};
