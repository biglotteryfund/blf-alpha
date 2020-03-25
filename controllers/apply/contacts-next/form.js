'use strict';
const get = require('lodash/fp/get');

const { FormModel } = require('../lib/form-model');
const { Step, CustomStep } = require('../lib/step-model');
const fieldsFor = require('./fields');

module.exports = function ({ locale = 'en', data = {} } = {}) {
    const localise = get(locale);

    const fields = fieldsFor({
        locale: locale,
        data: data,
    });

    function stepCheckContacts() {
        return new CustomStep({
            title: 'Check your contacts',
            render: require('./contact-check'),
        });
    }

    function stepContactNames() {
        return new Step({
            title: localise({
                en: 'Senior & Main contacts',
                cy: '@TODO i18n',
            }),
            introduction: localise({
                en: `<p>
                            Please give us the contact details of two different
                            people at your organisation. They must both live in the UK.
                        </p>
                        <p>The two contacts can't be</p>
                        <ul>                            
                            <li>married to each other</li>
                            <li>in a long-term relationship together</li>
                            <li>living at the same address</li>
                            <li>or related by blood.</li> 
                        </ul>`,
                cy: '@TODO i18n',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: 'Senior contact',
                        cy: '@TODO i18n',
                    }),
                    introduction: localise({
                        en: `<p>Your senior contact should be</p>
                                    <ul>
                                        <li>a senior leader or member of board or committee</li>
                                        <li>legally responsible for this funding and meeting any monitoring requirements</li>
                                    </ul>`,
                        cy: '@TODO i18n',
                    }),
                    fields: [
                        fields.seniorContactRole,
                        fields.seniorContactName,
                    ],
                },
                {
                    legend: localise({
                        en: 'Main contact',
                        cy: '@TODO i18n',
                    }),
                    introduction: localise({
                        en: `<p>Your main contact should be</p>
                                <ul>
                                    <li>our primary contact if we have any questions</li>
                                    <li>from the organisation applying</li>
                                </ul>
                                <p>They don't have to hold any particular position.</p>`,
                        cy: '@TODO i18n',
                    }),
                    fields: [fields.mainContactName],
                },
            ],
        });
    }

    function stepSeniorContactDoB() {
        return new Step({
            title: localise({
                en: 'Date of birth',
                cy: '@TODO i18n',
            }),
            fieldsets: [
                {
                    legend: localise({
                        en: '@TODO',
                        cy: '@TODO i18n',
                    }),
                    fields: [fields.seniorContactDateOfBirth],
                },
            ],
        });
    }

    function stepSeniorContactAddress() {
        return new Step({
            title: localise({
                en: 'Home address',
                cy: '@TODO i18n',
            }),
            fieldsets: [
                {
                    fields: [
                        fields.seniorContactAddress,
                        fields.seniorContactAddressHistory,
                    ],
                },
            ],
        });
    }

    function stepSeniorContactCommunication() {
        return new Step({
            title: localise({
                en: 'Contact details',
                cy: '@TODO i18n',
            }),
            fieldsets: [
                {
                    fields: [
                        fields.seniorContactEmail,
                        fields.seniorContactPhone,
                        fields.seniorContactLanguagePreference,
                        fields.seniorContactCommunicationNeeds,
                    ],
                },
            ],
        });
    }

    function stepMainContactDoB() {
        return new Step({
            title: localise({
                en: 'Date of birth',
                cy: '@TODO i18n',
            }),
            fieldsets: [
                {
                    fields: [fields.mainContactDateOfBirth],
                },
            ],
        });
    }

    function stepMainContactAddress() {
        return new Step({
            title: localise({
                en: 'Home address',
                cy: '@TODO i18n',
            }),
            fieldsets: [
                {
                    fields: [
                        fields.mainContactAddress,
                        fields.mainContactAddressHistory,
                    ],
                },
            ],
        });
    }

    function stepMainContactCommunication() {
        return new Step({
            title: localise({
                en: 'Contact details',
                cy: '@TODO i18n',
            }),
            fieldsets: [
                {
                    fields: [
                        fields.mainContactEmail,
                        fields.mainContactPhone,
                        fields.mainContactLanguagePreference,
                        fields.mainContactCommunicationNeeds,
                    ],
                },
            ],
        });
    }

    const form = {
        title: localise({
            en: '[DEV] Contacts Next',
            cy: '[DEV] Arian i Bawb y Loteri Genedlaethol',
        }),
        startLabel: localise({
            en: 'Start your application',
            cy: 'Dechrau ar eich cais',
        }),
        allFields: fields,
        summary: {
            title: 'Contacts prototype',
            country: null,
            overview: [],
        },
        schemaVersion: 'v1.1',
        forSalesforce: function () {
            return data;
        },
        sections: [
            {
                slug: 'contacts',
                title: localise({
                    en: 'Contacts',
                    cy: '@TODO localise',
                }),
                summary: localise({
                    en: `@TODO localise`,
                    cy: `@TODO localise`,
                }),
                steps: [
                    stepContactNames(),
                    stepSeniorContactDoB(),
                    stepSeniorContactAddress(),
                    stepSeniorContactCommunication(),
                    stepCheckContacts(),
                    stepMainContactDoB(),
                    stepMainContactAddress(),
                    stepMainContactCommunication(),
                    stepCheckContacts(),
                ],
            },
        ],
    };

    return new FormModel(form, data, locale);
};
