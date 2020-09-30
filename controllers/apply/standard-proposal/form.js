'use strict';
const config = require('config');
const { oneLine } = require('common-tags');
const clone = require('lodash/clone');
const compact = require('lodash/compact');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const includes = require('lodash/includes');

const { FormModel } = require('../lib/form-model');
const { Step } = require('../lib/step-model');
const {
    BENEFICIARY_GROUPS,
    CONTACT_EXCLUDED_TYPES,
    ORGANISATION_TYPES,
    COMPANY_NUMBER_TYPES,
    CHARITY_NUMBER_TYPES,
    EDUCATION_NUMBER_TYPES,
} = require('./constants');

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
                  For projects in Scotland or Wales, or right across the UK, you'll need to <a href="">read our programme pages for funding over £10,000</a> to find out how to apply.
            </p>`,
            cy: `<p>
                  For projects in Scotland or Wales, or right across the UK, you'll need to read our programme pages for funding over £10,000 to find out how to apply.
            </p>`,
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
                return projectCountries.includes('england')
                    ? [
                          allFields.projectLocation,
                          allFields.projectLocationDescription,
                          allFields.projectLocationPostcode,
                      ]
                    : [
                          allFields.projectLocation,
                          allFields.projectLocationDescription,
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
            fieldsets: [{ fields: fields() }],
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
                en: 'Specific groups of people',
                cy: 'Grwpiau penodol o bobl',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Specific groups of people',
                        cy: 'Grwpiau penodol o bobl',
                    }),
                    get fields() {
                        const beneficiariesFields = [
                            allFields.beneficiariesGroups,
                            allFields.beneficiariesGroupsOther,
                        ];
                        return conditionalFields(
                            beneficiariesFields,
                            compact([
                                groupsCheck === 'yes' &&
                                    allFields.beneficiariesGroups,
                                groupsCheck === 'yes' &&
                                    allFields.beneficiariesGroupsOther,
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

    function stepEthnicBackground() {
        return new Step({
            title: localise({ en: 'Ethnic background', cy: 'Cefndir ethnig' }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Ethnic background',
                        cy: 'Cefndir ethnig',
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

    function stepGender() {
        return new Step({
            title: localise({ en: 'Gender', cy: 'Rhyw' }),
            fieldsets: [
                {
                    legend: localise({ en: 'Gender', cy: 'Rhyw' }),
                    fields: conditionalFields(
                        [allFields.beneficiariesGroupsGender],
                        includeIfBeneficiaryType(BENEFICIARY_GROUPS.GENDER, [
                            allFields.beneficiariesGroupsGender,
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
                            allFields.beneficiariesGroupsReligionOther,
                        ];
                        return conditionalFields(
                            beneficiariesFields,
                            includeIfBeneficiaryType(
                                BENEFICIARY_GROUPS.RELIGION,
                                allFields
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

    function stepOrganisationDetails() {
        return new Step({
            title: localise({
                en: 'Organisation details',
                cy: '',
            }),
            noValidate: false,
            fieldsets: [
                {
                    fields: [
                        allFields.organisationLegalName,
                        allFields.organisationTradingName,
                        allFields.organisationAddress,
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
                    stepProjectDates(),
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
                en: `Please tell us about your project in this section.`,
                cy: ``,
            }),
            steps: steps(),
        };
    }

    function sectionBeneficiaries() {
        return {
            slug: 'beneficiaries',
            title: localise({
                en: 'Who will benefit from your project?',
                cy: 'Pwy fydd yn elwa o’ch prosiect?',
            }),
            shortTitle: localise({
                en: 'Who will benefit',
                cy: 'Pwy fydd yn elwa',
            }),
            summary: localise({
                en: `We want to hear more about the people who will benefit from your project.`,
                cy: `Rydym eisiau clywed mwy am y bobl a fydd yn elwa o’ch prosiect.`,
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
                stepNorthernIrelandCommunity(),
            ],
        };
    }

    function sectionYourOrganisation() {
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
            steps: [
                stepOrganisationDetails(),
                stepOrganisationType(),
                stepOrganisationSubType(),
            ],
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

    function sections() {
        if (projectCountries.includes('england')) {
            return [
                sectionYourProject(),
                sectionBeneficiaries(),
                sectionYourOrganisation(),
                sectionYourDetails(),
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

            /**
             * If projectCountries contains England
             * then pre-fill the projectDurationYears to 1 year
             * as this question is hidden from them
             */
            if (
                enriched.projectCountries.includes('england') &&
                flags.enableEnglandAutoProjectDuration
            ) {
                enriched.projectDurationYears = 1;
            }
            return enriched;
        },
        sections: sections(),
    };

    return new FormModel(form, data, locale);
};
