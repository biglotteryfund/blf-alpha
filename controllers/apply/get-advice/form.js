'use strict';
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const includes = require('lodash/includes');

const { FormModel } = require('../lib/form-model');
const fieldsFor = require('./fields');

module.exports = function({ locale = 'en', data = {} } = {}) {
    const localise = get(locale);

    const allFields = fieldsFor({ locale, data });

    const projectCountries = getOr([], 'projectCountry')(data);

    function stepProjectCountry() {
        return {
            title: localise({
                en: 'Project country',
                cy: 'Gwlad y prosiect'
            }),
            noValidate: true,
            fieldsets: [
                {
                    fields: [allFields.projectCountry]
                }
            ]
        };
    }

    function stepProjectLocation() {
        return {
            title: localise({
                en: 'Project location',
                cy: 'Lleoliad y prosiect'
            }),
            noValidate: true,
            fieldsets: [
                {
                    get fields() {
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
            noValidate: true,
            fieldsets: [
                {
                    get fields() {
                        if (projectCountries.length < 2) {
                            return [
                                allFields.projectCosts,
                                allFields.projectDurationYears
                            ];
                        } else {
                            return [allFields.projectCosts];
                        }
                    }
                }
            ]
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
            noValidate: true,
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
                cy: ''
            }),
            noValidate: true,
            fieldsets: [
                {
                    fields: [allFields.organisationType]
                }
            ]
        };
    }

    function stepContactDetails() {
        return {
            title: localise({
                en: 'Contact details',
                cy: ''
            }),
            noValidate: true,
            fieldsets: [
                {
                    get fields() {
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
                }
            ]
        };
    }

    const form = {
        title: localise({
            en: 'Get advice on your idea',
            cy: ''
        }),
        allFields,
        sections: [
            {
                slug: 'your-project',
                title: localise({
                    en: 'Your project',
                    cy: 'Eich prosiect'
                }),
                steps: [
                    stepProjectCountry(),
                    stepProjectLocation(),
                    stepProjectCosts(),
                    stepYourIdea()
                ]
            },
            {
                slug: 'your-organisation',
                title: localise({
                    en: 'Your organisation',
                    cy: 'Eich sefydliad'
                }),
                steps: [stepOrganisationDetails(), stepOrganisationType()]
            },
            {
                slug: 'your-details',
                title: localise({
                    en: 'Your details',
                    cy: ''
                }),
                steps: [stepContactDetails()]
            }
        ]
    };

    return new FormModel(form, data, locale);
};
