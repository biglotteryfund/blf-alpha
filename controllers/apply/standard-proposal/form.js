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

const fieldsFor = require('./fields');

module.exports = function({
    locale = 'en',
    data = {},
    flags = {
        enableNewLocationQuestions: config.get(
            'standardFundingProposal.enableNewLocationQuestions'
        )
    },
    metadata = {}
} = {}) {
    const localise = get(locale);

    const allFields = fieldsFor({
        locale,
        data,
        flags
    });

    const projectCountries = getOr([], 'projectCountries')(data);

    function stepProjectName() {
        return new Step({
            title: localise({
                en: 'Project name',
                cy: 'Enw eich prosiect'
            }),
            fieldsets: [{ fields: [allFields.projectName] }]
        });
    }

    function stepProjectCountries() {
        return new Step({
            title: localise({
                en: 'Project country',
                cy: 'Gwlad y prosiect'
            }),
            fieldsets: [{ fields: [allFields.projectCountries] }]
        });
    }

    function stepProjectRegions() {
        return new Step({
            title: localise({
                en: 'Project area',
                cy: ''
            }),
            fieldsets: [
                {
                    fields: projectCountries.includes('england')
                        ? [allFields.projectRegions]
                        : []
                }
            ]
        });
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

        return new Step({
            title: localise({
                en: 'Project location',
                cy: 'Lleoliad y prosiect'
            }),
            fieldsets: [{ fields: fields() }]
        });
    }

    function stepProjectCosts() {
        return new Step({
            title: localise({
                en: 'Project costs',
                cy: 'Costau’r prosiect'
            }),
            fieldsets: [{ fields: [allFields.projectCosts] }]
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
            fieldsets: [{ fields: fields() }]
        });
    }

    function stepYourIdea() {
        return new Step({
            title: localise({
                en: 'Your idea',
                cy: 'Eich syniad'
            }),
            fieldsets: [
                {
                    fields: [
                        allFields.yourIdeaProject,
                        allFields.yourIdeaCommunity,
                        allFields.yourIdeaActivities
                    ]
                }
            ]
        });
    }

    function stepOrganisationDetails() {
        return new Step({
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
        });
    }

    function stepOrganisationType() {
        return new Step({
            title: localise({
                en: 'Organisation type',
                cy: 'Math o sefydliad'
            }),
            fieldsets: [{ fields: [allFields.organisationType] }]
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
                cy: 'Math o gorff statudol'
            }),
            fieldsets: [{ fields: fields() }]
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

        return new Step({
            title: localise({
                en: 'Contact details',
                cy: ''
            }),
            fieldsets: [{ fields: fields() }]
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

    function sectionYourProject() {
        return {
            slug: 'your-project',
            title: localise({
                en: 'Your project',
                cy: 'Eich prosiect'
            }),
            summary: localise({
                en: `Please tell us about your project in this section.`,
                cy: ``
            }),
            steps: compact([
                stepProjectName(),
                stepProjectCountries(),
                flags.enableNewLocationQuestions && stepProjectRegions(),
                stepProjectLocation(),
                stepProjectCosts(),
                stepProjectDuration(),
                stepYourIdea()
            ])
        };
    }

    function sectionYourOrganisation() {
        return {
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
        };
    }

    function sectionYourDetails() {
        return {
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
        };
    }

    const form = {
        title: localise({
            en: 'Your funding proposal',
            cy: ''
        }),
        startLabel: localise({
            en: 'Start your proposal',
            cy: 'Dechrau ar eich cynnig'
        }),
        allFields,
        summary: summary(),
        schemaVersion: flags.enableNewLocationQuestions ? 'v1.0-beta' : 'v0.2',
        forSalesforce() {
            const enriched = clone(data);
            if (metadata && metadata.programme) {
                enriched.projectName = `${metadata.programme.title}: ${enriched.projectName}`;
            }
            return enriched;
        },
        sections: [
            sectionYourProject(),
            sectionYourOrganisation(),
            sectionYourDetails()
        ]
    };

    return new FormModel(form, data, locale);
};
