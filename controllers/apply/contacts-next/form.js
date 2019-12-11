'use strict';
const config = require('config');
const clone = require('lodash/clone');
const compact = require('lodash/compact');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const has = require('lodash/fp/has');
const { safeHtml, oneLine } = require('common-tags');

const { FormModel } = require('../lib/form-model');
const fromDateParts = require('../lib/from-date-parts');
const { CONTACT_EXCLUDED_TYPES } = require('./constants');

const fieldsFor = require('./fields');
const { getContactFullName } = require('./lib/contacts');

module.exports = function({
    locale = 'en',
    data = {},
    showAllFields = false,
    flags = {
        // Set default flags based on config, but allow overriding for tests
        enableNewDateRange: config.get('awardsForAll.enableNewDateRange')
    }
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
        data: data,
        flags: flags
    });

    function isForCountry(country) {
        const currentCountry = get('projectCountry')(data);
        return currentCountry === country;
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

    function stepChooseContacts() {
        return {
            title: localise({ en: 'Senior & Main contacts', cy: '@TODO i18n' }),
            introduction: localise({
                en: safeHtml`<p>
                        Please give us the contact details of two different people at your organisation. They must both live in the UK.
                    </p>
                    <p>
                        The two contacts can't be    
                    </p>
                    <ul>                            
                        <li>married to each other</li>
                        <li>in a long-term relationship together</li>
                        <li>living at the same address</li>
                        <li>or related by blood.</li> 
                    </ul>
                `,
                cy: '@TODO i18n'
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Senior contact',
                        cy: '@TODO i18n'
                    }),
                    get introduction() {
                        return localise({
                            en: safeHtml`<p>
                                Your senior contact should be
                            </p>
                            <ul>
                                <li>a senior leader or member of board or committee</li>
                                <li>legally responsible for this funding and meeting any monitoring requirements</li>
                            </ul>
                            `,
                            cy: '@TODO i18n'
                        });
                    },
                    fields: [fields.seniorContactRole, fields.seniorContactName]
                },
                {
                    legend: localise({
                        en: 'Main contact',
                        cy: '@TODO i18n'
                    }),
                    get introduction() {
                        return localise({
                            en: safeHtml`<p>
                                Your main contact should be
                            </p>
                            <ul>
                                <li>our primary contact if we have any questions</li>
                                <li>from the organisation applying</li>
                            </ul>
                            <p>They don't have to hold any particular position.</p>
                            `,
                            cy: '@TODO i18n'
                        });
                    },
                    fields: [fields.mainContactName]
                }
            ]
        };
    }

    function stepSeniorContact() {
        return {
            title: localise({ en: 'Senior contact 2', cy: 'Uwch gyswllt' }),
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
                        const allFields = compact([
                            fields.mainContactName,
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

    function sectionChooseContacts() {
        return {
            slug: 'choose-contacts',
            title: localise({ en: 'Contacts', cy: '@TODO i18n' }),
            summary: localise({
                en: oneLine`@TODO`,
                cy: oneLine`@TODO i18n`
            }),
            steps: [stepChooseContacts()]
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
                    yn byw gyda na’n perthyn drwy waed i’r prif gyswllt.`
            }),
            steps: [
                {
                    title: localise({ en: 'Date of birth', cy: '@TODO i18n' }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: '@TODO',
                                cy: '@TODO i18n'
                            }),
                            get fields() {
                                const allFields = [
                                    fields.seniorContactDateOfBirth
                                ];

                                const filteredFields = compact([
                                    includeAddressAndDob() &&
                                        fields.seniorContactDateOfBirth
                                ]);
                                return conditionalFields(
                                    allFields,
                                    filteredFields
                                );
                            }
                        }
                    ]
                },
                {
                    title: localise({ en: 'Home address', cy: '@TODO i18n' }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: '@TODO',
                                cy: '@TODO i18n'
                            }),
                            get fields() {
                                const allFields = [fields.seniorContactAddress];

                                const filteredFields = compact([
                                    includeAddressAndDob() &&
                                        fields.seniorContactAddress
                                ]);
                                return conditionalFields(
                                    allFields,
                                    filteredFields
                                );
                            }
                        }
                    ]
                },
                {
                    title: localise({
                        en: 'Contact details',
                        cy: '@TODO i18n'
                    }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: '@TODO',
                                cy: '@TODO i18n'
                            }),
                            get fields() {
                                const allFields = [
                                    fields.seniorContactEmail,
                                    fields.seniorContactPhone,
                                    fields.seniorContactLanguagePreference,
                                    fields.seniorContactCommunicationNeeds
                                ];

                                const filteredFields = compact([
                                    fields.seniorContactEmail,
                                    fields.seniorContactPhone,
                                    isForCountry('wales') &&
                                        fields.seniorContactLanguagePreference,
                                    fields.seniorContactCommunicationNeeds
                                ]);
                                return conditionalFields(
                                    allFields,
                                    filteredFields
                                );
                            }
                        }
                    ]
                }
            ]
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
                    byddwn angen trafod eich prosiect.`
            }),
            steps: [
                {
                    title: localise({ en: 'Date of birth', cy: '@TODO i18n' }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: '@TODO',
                                cy: '@TODO i18n'
                            }),
                            get fields() {
                                const allFields = [
                                    fields.mainContactDateOfBirth
                                ];

                                const filteredFields = compact([
                                    includeAddressAndDob() &&
                                    fields.mainContactDateOfBirth
                                ]);
                                return conditionalFields(
                                    allFields,
                                    filteredFields
                                );
                            }
                        }
                    ]
                },
                {
                    title: localise({ en: 'Home address', cy: '@TODO i18n' }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: '@TODO',
                                cy: '@TODO i18n'
                            }),
                            get fields() {
                                const allFields = [fields.mainContactAddress];

                                const filteredFields = compact([
                                    includeAddressAndDob() &&
                                    fields.mainContactAddress
                                ]);
                                return conditionalFields(
                                    allFields,
                                    filteredFields
                                );
                            }
                        }
                    ]
                },
                {
                    title: localise({
                        en: 'Contact details',
                        cy: '@TODO i18n'
                    }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: '@TODO',
                                cy: '@TODO i18n'
                            }),
                            get fields() {
                                const allFields = [
                                    fields.mainContactEmail,
                                    fields.mainContactPhone,
                                    fields.mainContactLanguagePreference,
                                    fields.mainContactCommunicationNeeds
                                ];

                                const filteredFields = compact([
                                    fields.mainContactEmail,
                                    fields.mainContactPhone,
                                    isForCountry('wales') &&
                                    fields.mainContactLanguagePreference,
                                    fields.mainContactCommunicationNeeds
                                ]);
                                return conditionalFields(
                                    allFields,
                                    filteredFields
                                );
                            }
                        }
                    ]
                }
            ]
        };
    }

    function summary() {
        return {
            title: getOr(
                localise({
                    en: `Untitled application`,
                    cy: `Cais heb deitl`
                }),
                'projectName'
            )(data),
            country: get('projectCountry')(data),
            overview: []
        };
    }

    function forSalesforce() {
        function dateFormat(dt) {
            return fromDateParts(dt).format('YYYY-MM-DD');
        }

        const enriched = clone(data);

        if (
            flags.enableNewDateRange &&
            has('projectStartDate')(enriched) &&
            has('projectEndDate')(enriched)
        ) {
            enriched.projectStartDate = dateFormat(enriched.projectStartDate);
            enriched.projectEndDate = dateFormat(enriched.projectEndDate);

            // Support previous schema format
            enriched.projectDateRange = {
                startDate: dateFormat(enriched.projectStartDate),
                endDate: dateFormat(enriched.projectEndDate)
            };
        } else {
            enriched.projectDateRange = {
                startDate: dateFormat(enriched.projectDateRange.startDate),
                endDate: dateFormat(enriched.projectDateRange.endDate)
            };
        }

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
            en: '[DEV] Contacts Next',
            cy: '[DEV] Arian i Bawb y Loteri Genedlaethol'
        }),
        startLabel: localise({
            en: 'Start your application',
            cy: 'Dechrau ar eich cais'
        }),
        allFields: fields,
        summary: summary(),
        schemaVersion: 'v1.1',
        forSalesforce: forSalesforce,
        sections: [
            sectionChooseContacts(),
            sectionSeniorContact(),
            sectionMainContact()
        ]
    };

    return new FormModel(form, data, locale);
};
