'use strict';
const config = require('config');
const clone = require('lodash/clone');
const compact = require('lodash/compact');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const includes = require('lodash/includes');
const { safeHtml, oneLine } = require('common-tags');

const { FormModel } = require('../lib/form-model');
const { Step } = require('../lib/step-model');
const { getContactFullName } = require('./lib/contacts');
const { BENEFICIARY_GROUPS, CONTACT_EXCLUDED_TYPES } = require('./constants');

const terms = require('./terms');
const fieldsFor = require('./fields');

module.exports = function ({
    locale = 'en',
    data = {},
    metadata = {},
    showAllFields = false,
    flags = config.get('standardFundingProposal'),
} = {}) {
    const localise = get(locale);

    const allFields = fieldsFor({ locale, data, flags });

    const projectCountries = getOr([], 'projectCountries')(data);

    const currentOrganisationType = get('organisationType')(data);

    const conditionalFields = (fields, filteredFields) => {
        const filteredFieldNames = filteredFields.map((_) => _.name);
        const allFields = compact(
            fields.map((f) => {
                if (filteredFieldNames.indexOf(f.name) === -1) {
                    f.isConditional = true;
                }
                return f;
            })
        );

        return showAllFields ? allFields : filteredFields;
    };

    function stepProjectName() {
        return new Step({
            title: localise({
                en: 'Project name',
                cy: 'Enw eich prosiect',
            }),
            fieldsets: [{ fields: [allFields.projectName] }],
        });
    }

    function stepProjectCountries() {
        const footer = localise({
            en: `<p>
                  For projects in Scotland or Wales, or right across the UK, you'll need to <a href="/funding/over10k">read our programme pages for funding over £10,000</a> to find out how to apply.
            </p>`,
            cy: ``,
        });

        return new Step({
            title: localise({
                en: 'Project country',
                cy: 'Gwlad y prosiect',
            }),
            fieldsets: [
                { fields: [allFields.projectCountries], footer: footer },
            ],
        });
    }

    function stepProjectRegions() {
        return new Step({
            title: localise({
                en: 'Project area',
                cy: '',
            }),
            fieldsets: [
                {
                    fields: projectCountries.includes('england')
                        ? [allFields.projectRegions]
                        : [],
                },
            ],
        });
    }

    function stepProjectLocation() {
        function fields() {
            if (projectCountries.length > 1) {
                return [allFields.projectLocationDescription];
            } else if (projectCountries.length > 0) {
                return [
                    allFields.projectLocation,
                    allFields.projectLocationDescription,
                    allFields.projectLocationPostcode,
                ];
            } else {
                return [];
            }
        }

        return new Step({
            title: localise({
                en: 'Project location',
                cy: 'Lleoliad y prosiect',
            }),
            fieldsets: [{ fields: fields() }],
        });
    }

    function stepProjectCosts() {
        function fields() {
            if (projectCountries.includes('england')) {
                return [
                    allFields.projectTotalCost,
                    allFields.projectCosts,
                    allFields.projectSpend,
                ];
            } else {
                return [allFields.projectCosts];
            }
        }

        return new Step({
            title: localise({
                en: 'Project costs',
                cy: 'Costau’r prosiect',
            }),
            fieldsets: [
                {
                    fields: fields(),
                    introduction: localise({
                        en: `We understand that your costs can change. We just need some estimates at this stage.`,
                        cy: ``,
                    }),
                },
            ],
        });
    }

    function stepProjectDuration() {
        function fields() {
            if (projectCountries.length < 2) {
                return [allFields.projectDurationYears];
            } else {
                return [];
            }
        }

        return new Step({
            title: localise({ en: 'Project duration', cy: '' }),
            fieldsets: [{ fields: fields() }],
        });
    }

    function stepProjectDates() {
        return new Step({
            title: localise({ en: 'Project start date', cy: '' }),
            fieldsets: [{ fields: [allFields.projectStartDate] }],
        });
    }

    function stepYourIdea() {
        return new Step({
            title: localise({
                en: 'Your idea',
                cy: 'Eich syniad',
            }),
            fieldsets: [
                {
                    fields: [
                        allFields.yourIdeaProject,
                        allFields.yourIdeaCommunity,
                        allFields.yourIdeaActivities,
                    ],
                },
            ],
        });
    }

    function stepYourOrganisation() {
        return new Step({
            title: localise({
                en: 'Your organisation',
                cy: '',
            }),
            fieldsets: [
                {
                    fields: [
                        allFields.projectWebsite,
                        allFields.projectOrganisation,
                    ],
                },
            ],
        });
    }

    function stepBeneficairiesPreflightCheck() {
        return new Step({
            title: localise({
                en: `Making sure our grantmaking is fair`,
                cy: `Grwpiau penodol o bobl`,
            }),
            fieldsets: [
                {
                    introduction: localise({
                        en: `<p>
                            We’d like to ask some questions about the people being supported and your organisation, 
                            to help us to understand our applicants and funding better.
                            </p>

                            <p>This information is being used to inform our own monitoring and strategy and will not be 
                            used as the basis of individual funding decisions. There’s no judgment on - or preference 
                            for - particular responses except where explicitly specified in the criteria for the Fund.</p>



                            <p>If you’re successful in being awarded a grant, the responses you provide in this section
                             may be included in data published about our grants. This is to support the transparency 
                             and accountability on our grantmaking. If this may cause any issues, you’ll have an 
                             opportunity to not provide some of the data and prevent it from being shared externally.
                             </p>

                            <h3>Equity</h3>
                            <p>In the context of grant-making, improving equity is to about promoting justice, 
                            impartiality and fairness in how we give out money.  To be able to tackle equity issues, 
                            we need to understand the causes of the disparities faced by some communities.</p>
                            
                            <h3>Diversity</h3>
                            <p>Diversity means including various aspects of the differences between people. 
                            They include race and ethnicity, sexual orientation, disability and gender. Nuanced 
                            definitions of diversity also recognise the intersectional nature of identity and the 
                            complex and cumulative ways in which different forms of discrimination 
                            (based upon these attributes) combine, overlap, and intersect.</p>

                            <h3>Inclusion</h3>
                            <p>Inclusion refers to the degree to which people feel valued and able to participate 
                            fully in decision-making processes. While an 'inclusive' group is diverse, a 'diverse' 
                            group may or may not be 'inclusive'.</p>`,
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
                        </p>`,
                    }),
                    fields: [allFields.beneficiariesPreflightCheck],
                },
            ],
        });
    }

    function stepBeneficiariesCheck() {
        return new Step({
            title: localise({
                en: `Specific groups of people`,
                cy: `Grwpiau penodol o bobl`,
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: `Specific groups of people`,
                        cy: `Grwpiau penodol o bobl`,
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
                        </p>`,
                    }),
                    fields: [allFields.beneficiariesGroupsCheck],
                },
            ],
        });
    }

    function stepBeneficiariesGroups() {
        const groupsCheck = get('beneficiariesGroupsCheck')(data);
        return new Step({
            title: localise({
                en: 'Benefitting specific groups',
                cy: 'Grwpiau penodol o bobl',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Benefitting specific groups',
                        cy: 'Grwpiau penodol o bobl',
                    }),
                    get fields() {
                        const beneficiariesFields = [
                            allFields.beneficiariesGroups,
                        ];
                        return conditionalFields(
                            beneficiariesFields,
                            compact([
                                groupsCheck === 'yes' &&
                                    allFields.beneficiariesGroups,
                            ])
                        );
                    },
                },
            ],
        });
    }

    /**
     * Include fields based on the beneficiary groups selected.
     * Used to conditionally render fields for age, gender etc.
     */
    function includeIfBeneficiaryType(type, fields) {
        const groupChoices = get('beneficiariesGroups')(data) || [];
        return groupChoices.includes(type) ? fields : [];
    }

    function includeIfDifferentName(fields) {
        return get('organisationDifferentName')(data) === 'yes' ? fields : [];
    }

    function stepEthnicBackground() {
        return new Step({
            title: localise({ en: 'Communities experiencing ethnic or racial inequity', cy: '' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Communities experiencing ethnic or racial inequity',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesEthnicBackground],
                        includeIfBeneficiaryType(
                            BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                            [allFields.beneficiariesEthnicBackground]
                        )
                    ),
                },
            ],
        });
    }

    function stepMigrants(){
        return new Step({
            title: localise({ en: 'Migrants', cy: ''}),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Migrants',
                        cy: ''
                    }),
                    fields: conditionalFields(
                        [ allFields.beneficiariesGroupsMigrant ],
                        includeIfBeneficiaryType(
                            BENEFICIARY_GROUPS.MIGRANT,
                            [ allFields.beneficiariesGroupsMigrant ]
                        )
                    ),
                }
            ]
        });
    }

    function stepLGBT() {
        return new Step({
            title: localise({ en: 'LGBT+ people', cy: 'Rhyw' }),
            fieldsets: [
                {
                    legend: localise({ en: 'LGBT+ people', cy: 'Rhyw' }),
                    fields: conditionalFields(
                        [allFields.beneficiariesGroupsLGBT],
                        includeIfBeneficiaryType(BENEFICIARY_GROUPS.LGBT, [
                            allFields.beneficiariesGroupsLGBT,
                        ])
                    ),
                },
            ],
        });
    }

    function stepAge() {
        return new Step({
            title: localise({ en: 'Age', cy: 'Oedran' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Age', cy: 'Oedran' }),
                    fields: conditionalFields(
                        [allFields.beneficiariesGroupsAge],
                        includeIfBeneficiaryType(BENEFICIARY_GROUPS.AGE, [
                            allFields.beneficiariesGroupsAge,
                        ])
                    ),
                },
            ],
        });
    }

    function stepDisabledPeople() {
        return new Step({
            title: localise({ en: 'Disabled people', cy: 'Pobl anabl' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Disabled people',
                        cy: 'Pobl anabl',
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesGroupsDisabledPeople],
                        includeIfBeneficiaryType(
                            BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                            [allFields.beneficiariesGroupsDisabledPeople]
                        )
                    ),
                },
            ],
        });
    }

    function stepOtherBeneficiaryGroups()
    {
        return new Step({
            title: localise({ en: 'Specific groups that are not included already', cy: ''}),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Specific groups that are not included already',
                        cy: '',
                    }),
                    fields: conditionalFields(
                        [ allFields.beneficiariesGroupsOther ],
                        includeIfBeneficiaryType(
                            BENEFICIARY_GROUPS.OTHER,
                            [ allFields.beneficiariesGroupsOther ]
                        )
                    ),
                },
            ],
        });
    }

    function stepReligionOrFaith() {
        return new Step({
            title: localise({
                en: 'Religion or belief',
                cy: 'Crefydd neu gred',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Religion or belief',
                        cy: 'Crefydd neu gred',
                    }),
                    get fields() {
                        const beneficiariesFields = [
                            allFields.beneficiariesGroupsReligion,
                        ];
                        return conditionalFields(
                            beneficiariesFields,
                            includeIfBeneficiaryType(
                                BENEFICIARY_GROUPS.RELIGION,
                                beneficiariesFields
                            )
                        );
                    },
                },
            ],
        });
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
        return new Step({
            title: localise({
                en: `People who speak Welsh`,
                cy: `Pobl sy’n siarad Cymraeg`,
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: `People who speak Welsh`,
                        cy: `Pobl sy’n siarad Cymraeg`,
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesWelshLanguage],
                        includeIfCountry('wales', [
                            allFields.beneficiariesWelshLanguage,
                        ])
                    ),
                },
            ],
        });
    }

    function stepNorthernIrelandCommunity() {
        return new Step({
            title: localise({
                en: `Northern Ireland community`,
                cy: `Cymuned Gogledd Iwerddon`,
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: `Northern Ireland community`,
                        cy: `Cymuned Gogledd Iwerddon`,
                    }),
                    fields: conditionalFields(
                        [allFields.beneficiariesNorthernIrelandCommunity],
                        includeIfCountry('northern-ireland', [
                            allFields.beneficiariesNorthernIrelandCommunity,
                        ])
                    ),
                },
            ],
        });
    }

    function stepOrganisationLegalName() {
        return new Step({
            title: localise({
                en: 'Organisation legal name',
                cy: '',
            }),
            noValidate: false,
            fieldsets: [
                {
                    fields: [
                        allFields.organisationLegalName,
                        allFields.organisationDifferentName,
                    ],
                },
            ],
        });
    }

    function stepOrganisationTradingName() {
        return new Step({
            title: localise({
                en: 'Organisation trading name',
                cy: '',
            }),
            noValidate: false,
            fieldsets: [
                {
                    fields: conditionalFields(
                        [allFields.organisationTradingName],
                        includeIfDifferentName([
                            allFields.organisationTradingName,
                        ])
                    ),
                },
            ],
        });
    }

    function stepOrganisationAddress() {
        return new Step({
            title: localise({
                en: 'Organisation address',
                cy: '',
            }),
            noValidate: false,
            fieldsets: [
                {
                    fields: [allFields.organisationAddress],
                },
            ],
        });
    }

    function stepOrganisationStartDate() {
        return new Step({
            title: localise({
                en: 'Organisation start date',
                cy: '',
            }),
            fieldsets: [{ fields: [allFields.organisationStartDate] }],
        });
    }

    function stepOrganisationSupport() {
        return new Step({
            title: localise({
                en: 'People supported by the organisation',
                cy: '',
            }),
            fieldsets: [{ fields: [allFields.organisationSupport] }],
        });
    }

    function stepOrganisationStaff() {
        return new Step({
            title: localise({
                en: 'Organisation volunteers, staff and leadership ',
                cy: '',
            }),
            fieldsets: [
                {
                    fields: [
                        allFields.organisationVolunteers,
                        allFields.organisationFullTimeStaff,
                        allFields.organisationLeadership,
                    ],
                },
            ],
        });
    }

    function stepOrganisationType() {
        return new Step({
            title: localise({
                en: 'Organisation type',
                cy: 'Math o sefydliad',
            }),
            fieldsets: [{ fields: [allFields.organisationType] }],
        });
    }

    function stepOrganisationSubType() {
        function fields() {
            const currentOrganisationType = get('organisationType')(data);
            if (currentOrganisationType === 'statutory-body') {
                return [allFields.organisationSubType];
            } else {
                return [];
            }
        }

        return new Step({
            title: localise({
                en: 'Type of statutory body',
                cy: 'Math o gorff statudol',
            }),
            fieldsets: [{ fields: fields() }],
        });
    }

    function stepFinancialPosition() {
        return new Step({
            title: localise({
                en: 'Organisation financial position',
                cy: '',
            }),
            fieldsets: [
                {
                    fields: [
                        allFields.accountingYearDate,
                        allFields.totalIncomeYear,
                    ],
                },
            ],
        });
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
        return new Step({
            title: localise({ en: 'Senior contact', cy: 'Uwch gyswllt' }),
            noValidate: false,
            fieldsets: [
                {
                    legend: localise({
                        en: 'Who is your senior contact?',
                        cy: 'Pwy yw eich uwch gyswllt?',
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
                            funded organisation meets our monitoring requirements. Our identity checks may 
                            appear on a credit report, but it’s not a credit check and can only be seen by 
                            the person we’re checking, so their credit rating won’t be affected. Find out 
                            more about the checks we 
                            <a href="https://www.tnlcommunityfund.org.uk/funding/funding-guidance/information-checks">carry out on your information</a>.                           
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
                        </p>`,
                    }),
                    get fields() {
                        const contactFields = [
                            allFields.seniorContactRole,
                            allFields.seniorContactName,
                            allFields.seniorContactDateOfBirth,
                            allFields.seniorContactAddress,
                            allFields.seniorContactAddressHistory,
                            allFields.seniorContactEmail,
                            allFields.seniorContactPhone,
                            allFields.seniorContactLanguagePreference,
                            allFields.seniorContactCommunicationNeeds,
                        ];

                        const filteredFields = compact([
                            allFields.seniorContactRole,
                            allFields.seniorContactName,
                            includeAddressAndDob() &&
                                allFields.seniorContactDateOfBirth,
                            includeAddressAndDob() &&
                                allFields.seniorContactAddress,
                            includeAddressAndDob() &&
                                allFields.seniorContactAddressHistory,
                            allFields.seniorContactEmail,
                            allFields.seniorContactPhone,
                            isForCountry('wales') &&
                                allFields.seniorContactLanguagePreference,
                            allFields.seniorContactCommunicationNeeds,
                        ]);
                        return conditionalFields(contactFields, filteredFields);
                    },
                },
            ],
        });
    }

    function stepMainContact() {
        return new Step({
            title: localise({ en: 'Main contact', cy: 'Prif gyswllt' }),
            noValidate: false,
            fieldsets: [
                {
                    legend: localise({
                        en: 'Who is your main contact?',
                        cy: 'Pwy yw eich prif gyswllt?',
                    }),
                    get introduction() {
                        const seniorName = getContactFullName(
                            get('seniorContactName')(data)
                        );

                        const seniorNameMsg = seniorName
                            ? safeHtml`, <strong data-hj-suppress>${seniorName}</strong>`
                            : '';

                        return localise({
                            en:
                                safeHtml`<p>
                                Please give us the contact details of a person
                                we can get in touch with if we have any questions.
                                The main contact is usually the person filling in
                                the form—so it's probably you. The main contact needs
                                to be from the organisation applying, but they don't
                                need to hold a particular position. Our identity checks 
                                may appear on a credit report, but it’s not a credit 
                                check and can only be seen by the person we’re checking, 
                                so their credit rating won’t be affected. Find out more 
                                about the checks we 
                                <a href="https://www.tnlcommunityfund.org.uk/funding/funding-guidance/information-checks">carry out on your information</a>.    
                            </p>
                            <p>
                                The main contact must be a different person from the senior contact` +
                                seniorNameMsg +
                                `. The two contacts also can't be:
                            </p>
                            <ul>                            
                                <li>be married to each other or in a civil partnership</li>
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
                            `,
                        });
                    },
                    get fields() {
                        const contactFields = compact([
                            allFields.mainContactName,
                            allFields.mainContactDateOfBirth,
                            allFields.mainContactAddress,
                            allFields.mainContactAddressHistory,
                            allFields.mainContactEmail,
                            allFields.mainContactPhone,
                            allFields.mainContactLanguagePreference,
                            allFields.mainContactCommunicationNeeds,
                        ]);

                        return conditionalFields(
                            contactFields,
                            compact([
                                allFields.mainContactName,
                                includeAddressAndDob() &&
                                    allFields.mainContactDateOfBirth,
                                includeAddressAndDob() &&
                                    allFields.mainContactAddress,
                                includeAddressAndDob() &&
                                    allFields.mainContactAddressHistory,
                                allFields.mainContactEmail,
                                allFields.mainContactPhone,
                                isForCountry('wales') &&
                                    allFields.mainContactLanguagePreference,
                                allFields.mainContactCommunicationNeeds,
                            ])
                        );
                    },
                },
            ],
        });
    }

    function stepContactDetails() {
        function fields() {
            if (includes(projectCountries, 'wales')) {
                return [
                    allFields.contactName,
                    allFields.contactEmail,
                    allFields.contactPhone,
                    allFields.contactLanguagePreference,
                    allFields.contactCommunicationNeeds,
                ];
            } else {
                return [
                    allFields.contactName,
                    allFields.contactEmail,
                    allFields.contactPhone,
                    allFields.contactCommunicationNeeds,
                ];
            }
        }

        return new Step({
            title: localise({
                en: 'Contact details',
                cy: '',
            }),
            fieldsets: [{ fields: fields() }],
        });
    }

    function stepTerms() {
        const title = localise({
            en: 'Your declaration',
            cy: '',
        });

        return new Step({
            title: title,
            fieldsets: [
                {
                    legend: title,
                    introduction: terms(locale, data, flags),
                    get fields() {
                        return compact([
                            allFields.termsAgreement1,
                            allFields.termsAgreement2,
                            allFields.termsAgreement3,
                            allFields.termsAgreement4,
                            allFields.termsAgreement5,
                            allFields.termsAgreement6,
                            allFields.termsPersonName,
                            allFields.termsPersonPosition,
                        ]);
                    },
                },
            ],
        });
    }

    function summary() {
        const title = get('projectName')(data);
        const countries = getOr([], 'projectCountries')(data);
        const years = get('projectDurationYears')(data);
        const costs = get('projectCosts')(data);

        const overview = [
            {
                label: localise({ en: 'Requested amount', cy: '' }),
                value: costs ? `£${costs.toLocaleString()}` : null,
            },
            {
                label: localise({ en: 'Project duration', cy: '' }),
                value: years
                    ? localise({ en: `${years} years`, cy: '' })
                    : null,
            },
        ];

        return {
            title: title,
            country: countries.length > 1 ? 'uk-wide' : countries[0],
            overview: overview,
        };
    }

    function sectionYourProject() {
        function steps() {
            if (projectCountries.includes('england')) {
                return compact([
                    stepProjectName(),
                    stepProjectCountries(),
                    stepProjectRegions(),
                    stepProjectLocation(),
                    stepProjectCosts(),
                    stepProjectDates(),
                    stepProjectDuration(),
                    stepYourIdea(),
                    stepYourOrganisation(),
                ]);
            } else {
                return compact([
                    stepProjectName(),
                    stepProjectCountries(),
                    stepProjectRegions(),
                    stepProjectLocation(),
                    stepProjectCosts(),
                    stepProjectDuration(),
                    stepYourIdea(),
                ]);
            }
        }
        return {
            slug: 'your-project',
            title: localise({
                en: 'Your project',
                cy: 'Eich prosiect',
            }),
            summary: localise({
                en: oneLine`Please tell us about your project in this section. This 
                is the most important section when it comes to making a decision 
                about whether you will receive funding.`,
                cy: ``,
            }),
            steps: steps(),
        };
    }

    function sectionBeneficiaries() {
        return {
            slug: 'beneficiaries',
            title: localise({
                en: 'Equity, Diversity and Inclusion (EDI) monitoring information',
                cy: '',
            }),
            shortTitle: localise({
                en: 'Equity, Diversity and Inclusion (EDI) monitoring information',
                cy: '',
            }),
            summary: localise({
                en: `We want to hear more about the people who’ll benefit from your project and your organisation.`,
                cy: ``,
            }),
            steps: [
                stepBeneficairiesPreflightCheck(),
                stepBeneficiariesCheck(),
                stepBeneficiariesGroups(),
                stepEthnicBackground(),
                stepReligionOrFaith(),
                stepMigrants(),
                stepDisabledPeople(),
                stepAge(),
                stepLGBT(),
                stepOtherBeneficiaryGroups(),
                stepWelshLanguage(),
                stepNorthernIrelandCommunity(),
            ],
        };
    }

    function sectionYourOrganisation() {
        function steps() {
            if (projectCountries.includes('england')) {
                return [
                    stepOrganisationLegalName(),
                    stepOrganisationTradingName(),
                    stepOrganisationAddress(),
                    stepOrganisationStartDate(),
                    stepOrganisationSupport(),
                    stepOrganisationStaff(),
                    stepOrganisationType(),
                    stepOrganisationSubType(),
                    stepFinancialPosition(),
                ];
            } else {
                return [
                    stepOrganisationLegalName(),
                    stepOrganisationTradingName(),
                    stepOrganisationAddress(),
                    stepOrganisationType(),
                    stepOrganisationSubType(),
                ];
            }
        }
        return {
            slug: 'your-organisation',
            title: localise({
                en: 'Your organisation',
                cy: 'Eich sefydliad',
            }),
            summary: localise({
                en: oneLine`Please tell us about your organisation,
                    including legal name and registered address.
                    This helps us understand the type of organisation you are.`,
                cy: oneLine`Dywedwch wrthym am eich sefydliad, gan gynnwys yr
                    enw cyfreithiol,  cyfeiriad cofrestredig ac incwm.
                    Mae hyn yn ein helpu i ddeall pa fath o sefydliad ydych.`,
            }),
            steps: steps(),
        };
    }

    function sectionSeniorContact() {
        return {
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
                    yn byw gyda na’n perthyn drwy waed i’r prif gyswllt.`,
            }),
            steps: [stepSeniorContact()],
        };
    }

    function sectionMainContact() {
        return {
            slug: 'main-contact',
            title: localise({ en: 'Main contact', cy: 'Prif gyswllt' }),
            summary: localise({
                en: oneLine`Please provide details for your main contact.
                    This will be the first person we contact if we
                    need to discuss your project.`,
                cy: oneLine`Darparwch fanylion ar gyfer eich prif gyswllt. 
                    Dyma fydd y person cyntaf i ni gysylltu â nhw os 
                    byddwn angen trafod eich prosiect.`,
            }),
            steps: [stepMainContact()],
        };
    }

    function sectionYourDetails() {
        return {
            slug: 'your-details',
            title: localise({
                en: 'Your details',
                cy: '',
            }),
            summary: localise({
                en: oneLine`Please provide details for the person
                    we should contact to talk about your idea.`,
                cy: ``,
            }),
            steps: [stepContactDetails()],
        };
    }

    function sectionTerms() {
        return {
            slug: 'terms-and-conditions',
            title: localise({
                en: 'Your declaration',
                cy: '',
            }),
            summary: localise({
                en: oneLine`In order to submit your application,
                    you will need to agree to our terms and conditions.`,
                cy: oneLine`Er mwyn anfon eich cais, 
                    bydd angen i chi gytuno â'n Telerau ac Amodau.`,
            }),
            steps: [stepTerms()],
        };
    }

    function sections() {
        if (projectCountries.includes('england')) {
            return [
                sectionYourProject(),
                sectionBeneficiaries(),
                sectionYourOrganisation(),
                sectionSeniorContact(),
                sectionMainContact(),
                sectionTerms(),
            ];
        } else {
            return [
                sectionYourProject(),
                sectionYourOrganisation(),
                sectionYourDetails(),
            ];
        }
    }

    const form = {
        title: localise({
            en: 'Your funding proposal',
            cy: '',
        }),
        startLabel: localise({
            en: 'Start your proposal',
            cy: 'Dechrau ar eich cynnig',
        }),
        allFields,
        summary: summary(),
        schemaVersion: 'v1.0',
        forSalesforce() {
            const enriched = clone(data);
            if (metadata && metadata.programme) {
                enriched.projectName = `${metadata.programme.title}: ${enriched.projectName}`;
            }

            return enriched;
        },
        sections: sections(),
    };

    return new FormModel(form, data, locale);
};
