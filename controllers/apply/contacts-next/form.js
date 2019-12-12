'use strict';
const config = require('config');
const clone = require('lodash/clone');
const compact = require('lodash/compact');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const has = require('lodash/fp/has');
const { safeHtml, oneLine } = require('common-tags');

const { FormModel } = require('../lib/form-model');
const { Step } = require('../lib/step-model');
const fromDateParts = require('../lib/from-date-parts');
const { CONTACT_EXCLUDED_TYPES } = require('./constants');
const fieldsFor = require('./fields');

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

    function sectionChooseContacts() {
        return {
            slug: 'choose-contacts',
            title: localise({ en: 'Contacts', cy: '@TODO i18n' }),
            summary: localise({
                en: oneLine`@TODO`,
                cy: oneLine`@TODO i18n`
            }),
            steps: [
                new Step({
                    title: localise({
                        en: 'Senior & Main contacts',
                        cy: '@TODO i18n'
                    }),
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
                            fields: [
                                fields.seniorContactRole,
                                fields.seniorContactName
                            ]
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
                })
            ]
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
                new Step({
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
                }),
                new Step({
                    title: localise({ en: 'Home address', cy: '@TODO i18n' }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: '@TODO',
                                cy: '@TODO i18n'
                            }),
                            get fields() {
                                const allFields = [
                                    fields.seniorContactAddress,
                                    fields.seniorContactAddressHistory
                                ];

                                const filteredFields = compact([
                                    includeAddressAndDob() &&
                                        fields.seniorContactAddress,
                                    includeAddressAndDob() &&
                                        fields.seniorContactAddressHistory
                                ]);
                                return conditionalFields(
                                    allFields,
                                    filteredFields
                                );
                            }
                        }
                    ]
                }),
                new Step({
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
                })
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
                new Step({
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
                }),
                new Step({
                    title: localise({ en: 'Home address', cy: '@TODO i18n' }),
                    fieldsets: [
                        {
                            legend: localise({
                                en: '@TODO',
                                cy: '@TODO i18n'
                            }),
                            get fields() {
                                const allFields = [
                                    fields.mainContactAddress,
                                    fields.mainContactAddressHistory
                                ];

                                const filteredFields = compact([
                                    includeAddressAndDob() &&
                                        fields.mainContactAddress,
                                    includeAddressAndDob() &&
                                        fields.mainContactAddressHistory
                                ]);
                                return conditionalFields(
                                    allFields,
                                    filteredFields
                                );
                            }
                        }
                    ]
                }),
                new Step({
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
                })
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
