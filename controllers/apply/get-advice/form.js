'use strict';
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const includes = require('lodash/includes');
const { oneLine } = require('common-tags');

const { FormModel } = require('../lib/form-model');
const fieldsFor = require('./fields');

module.exports = function({ locale = 'en', data = {} } = {}) {
    const localise = get(locale);

    const allFields = fieldsFor({ locale, data });

    const projectCountries = getOr([], 'projectCountries')(data);

    function stepProjectName() {
        return {
            title: localise({
                en: 'Project name',
                cy: 'Enw eich prosiect'
            }),
            noValidate: true,
            fieldsets: [{ fields: [allFields.projectName] }]
        };
    }

    function stepProjectCountries() {
        return {
            title: localise({
                en: 'Project country',
                cy: 'Gwlad y prosiect'
            }),
            noValidate: true,
            fieldsets: [{ fields: [allFields.projectCountries] }]
        };
    }

    function stepProjectLocation() {
        function fields() {
            if (projectCountries.length > 1) {
                return [allFields.projectLocationDescription];
            } else if (projectCountries.length > 0) {
                return [
                    allFields.projectLocation,
                    allFields.projectLocationDescription
                ];
            } else {
                return [];
            }
        }

        return {
            title: localise({
                en: 'Project location',
                cy: 'Lleoliad y prosiect'
            }),
            noValidate: true,
            fieldsets: [{ fields: fields() }]
        };
    }

    function stepProjectCosts() {
        return {
            title: localise({
                en: 'Project costs',
                cy: 'Costau’r prosiect'
            }),
            noValidate: true,
            fieldsets: [{ fields: [allFields.projectCosts] }]
        };
    }

    function stepProjectDuration() {
        function fields() {
            if (projectCountries.length < 2) {
                return [allFields.projectDurationYears];
            } else {
                return [];
            }
        }

        return {
            title: localise({ en: 'Project duration', cy: '' }),
            noValidate: true,
            fieldsets: [{ fields: fields() }]
        };
    }

    function stepYourIdea() {
        return {
            title: localise({
                en: 'Your idea',
                cy: 'Eich syniad'
            }),
            noValidate: true,
            fieldsets: [
                {
                    fields: [
                        allFields.yourIdeaProject,
                        allFields.yourIdeaCommunity,
                        allFields.yourIdeaActivities
                    ]
                }
            ]
        };
    }

    function stepOrganisationDetails() {
        return {
            title: localise({
                en: 'Organisation details',
                cy: ''
            }),
            noValidate: false,
            fieldsets: [
                {
                    fields: [
                        allFields.organisationLegalName,
                        allFields.organisationTradingName,
                        allFields.organisationAddress
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
            noValidate: true,
            fieldsets: [{ fields: [allFields.organisationType] }]
        };
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

        return {
            title: localise({
                en: 'Type of statutory body',
                cy: 'Math o gorff statudol'
            }),
            noValidate: true,
            fieldsets: [{ fields: fields() }]
        };
    }

    function stepContactDetails() {
        function fields() {
            if (includes(projectCountries, 'wales')) {
                return [
                    allFields.contactName,
                    allFields.contactEmail,
                    allFields.contactPhone,
                    allFields.contactLanguagePreference,
                    allFields.contactCommunicationNeeds
                ];
            } else {
                return [
                    allFields.contactName,
                    allFields.contactEmail,
                    allFields.contactPhone,
                    allFields.contactCommunicationNeeds
                ];
            }
        }

        return {
            title: localise({
                en: 'Contact details',
                cy: ''
            }),
            noValidate: true,
            fieldsets: [{ fields: fields() }]
        };
    }

    function summary() {
        const title = get('projectName')(data);
        const countries = getOr([], 'projectCountries')(data);
        const years = get('projectDurationYears')(data);
        const costs = get('projectCosts')(data);

        const overview = [
            {
                label: localise({ en: 'Requested amount', cy: '' }),
                value: costs ? `£${costs.toLocaleString()}` : null
            },
            {
                label: localise({ en: 'Project duration', cy: '' }),
                value: years ? localise({ en: `${years} years`, cy: '' }) : null
            }
        ];

        return {
            title: title,
            country: countries.length > 1 ? 'uk-wide' : countries[0],
            overview: overview
        };
    }

    const form = {
        title: localise({
            en: 'Get advice on your idea',
            cy: ''
        }),
        startLabel: localise({
            en: 'Start',
            cy: 'Dechrau'
        }),
        allFields,
        summary: summary(),
        schemaVersion: 'v0.1',
        forSalesforce() {
            return data;
        },
        sections: [
            {
                slug: 'your-project',
                title: localise({
                    en: 'Your project',
                    cy: 'Eich prosiect'
                }),
                summary: localise({
                    en: oneLine`Please tell us about your project in this section.`,
                    cy: ``
                }),
                steps: [
                    stepProjectName(),
                    stepProjectCountries(),
                    stepProjectLocation(),
                    stepProjectCosts(),
                    stepProjectDuration(),
                    stepYourIdea()
                ]
            },
            {
                slug: 'your-organisation',
                title: localise({
                    en: 'Your organisation',
                    cy: 'Eich sefydliad'
                }),
                summary: localise({
                    en: oneLine`Please tell us about your organisation,
                        including legal name and registered address.
                        This helps us understand the type of organisation you are.`,
                    cy: oneLine`Dywedwch wrthym am eich sefydliad, gan gynnwys yr
                        enw cyfreithiol,  cyfeiriad cofrestredig ac incwm.
                        Mae hyn yn ein helpu i ddeall pa fath o sefydliad ydych.`
                }),
                steps: [
                    stepOrganisationDetails(),
                    stepOrganisationType(),
                    stepOrganisationSubType()
                ]
            },
            {
                slug: 'your-details',
                title: localise({
                    en: 'Your details',
                    cy: ''
                }),
                summary: localise({
                    en: oneLine`Please provide details for the person
                        we should contact to talk about your idea.`,
                    cy: ``
                }),
                steps: [stepContactDetails()]
            }
        ]
    };

    return new FormModel(form, data, locale);
};
