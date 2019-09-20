'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../lib/joi-extensions');

const {
    TextField,
    EmailField,
    PhoneField,
    RadioField
} = require('../lib/field-types');

const { FormModel } = require('../lib/form-model');

module.exports = function({ locale = 'en', data = {} } = {}) {
    const localise = get(locale);

    const allFields = {
        projectCountry: new RadioField({
            name: 'projectCountry',
            label: localise({
                en: `What country (or countries) will your project take place in?`,
                cy: ``
            }),
            explanation: localise({
                en: oneLine`We work slightly differently depending on which
                    country your project is based in, to meet local needs
                    and the regulations that apply there.`,
                cy: ``
            }),
            options: [
                {
                    label: localise({
                        en: 'England',
                        cy: 'Lloegr'
                    }),
                    value: 'england'
                },
                {
                    label: localise({
                        en: 'Scotland',
                        cy: 'Yr Alban'
                    }),
                    value: 'scotland'
                },
                {
                    label: localise({
                        en: 'Northern Ireland',
                        cy: 'Gogledd Iwerddon'
                    }),
                    value: 'northern-ireland'
                },
                {
                    label: localise({
                        en: 'Wales',
                        cy: 'Cymru'
                    }),
                    value: 'wales'
                }
            ],
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a country',
                        cy: 'Dewiswch wlad'
                    })
                }
            ]
        }),
        projectLocation: {
            name: 'projectLocation',
            schema: Joi.when('projectCountry', {
                is: Joi.array().min(2),
                then: Joi.any().strip(),
                otherwise: Joi.string().required()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a location',
                        cy: 'Dewiswch leoliad'
                    })
                }
            ]
        },
        projectLocationDescription: new TextField({
            label: localise({
                en: 'Project location',
                cy: ''
            }),
            explanation: localise({
                en: oneLine`In your own words, describe all of the locations
                    that you'll be running your project in, e.g.
                    'Yorkshire' or 'Glasgow, Cardiff and Belfast'`,
                cy: ``
            }),
            name: 'projectLocationDescription',
            isRequired: false
        }),
        projectCosts: {
            name: 'projectCosts',
            schema: Joi.friendlyNumber()
                .integer()
                .min(10000)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a total cost for your project',
                        cy: 'Rhowch gyfanswm cost eich prosiect'
                    })
                },
                {
                    type: 'number.integer',
                    message: localise({
                        en: `Total cost must be a whole number (eg. no decimal point)`,
                        cy: `Rhaid i’r cost fod yn rif cyflawn (e.e. dim pwynt degol)`
                    })
                },
                {
                    type: 'number.min',
                    message: localise({
                        en: `Must be at least £10,000`,
                        cy: ``
                    })
                }
            ]
        },
        projectDurationYears: {
            name: 'projectDurationYears',
            schema: Joi.when('projectCountry', {
                is: Joi.array().min(2),
                then: Joi.any().strip()
            }).when('projectCountry', {
                is: Joi.array()
                    .items(
                        Joi.string()
                            .only('scotland')
                            .required()
                    )
                    .required(),
                then: Joi.number()
                    .integer()
                    .required()
                    .min(3)
                    .max(5),
                otherwise: Joi.number()
                    .integer()
                    .required()
                    .min(1)
                    .max(5)
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a project duration',
                        cy: ''
                    })
                }
            ]
        },
        projectIdea: new TextField({
            name: 'projectIdea',
            label: localise({
                en: 'What would you like to do?',
                cy: ''
            }),
            type: 'textarea',
            schema: Joi.string()
                .minWords(50)
                .maxWords(500)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us about your idea`,
                        cy: ``
                    })
                },
                {
                    type: 'string.minWords',
                    message: localise({
                        en: `Answer must be at least 50 words`,
                        cy: `Rhaid i’r ateb fod yn o leiaf 50 gair`
                    })
                },
                {
                    type: 'string.maxWords',
                    message: localise({
                        en: `Answer must be no more than 500 words`,
                        cy: `Rhaid i’r ateb fod yn llai na 500 gair`
                    })
                }
            ]
        }),
        organisationLegalName: new TextField({
            name: 'organisationLegalName',
            label: localise({
                en: 'What is the full legal name of your organisation?',
                cy: ''
            }),
            explanation: localise({
                en: oneLine`This must be as shown on your governing document.
                    Your governing document could be called one of several things,
                    depending on the type of organisation you're applying
                    on behalf of. It may be called a constitution, trust deed,
                    memorandum and articles of association,
                    or something else entirely.`,
                cy: ``
            }),
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter the full legal name of the organisation',
                        cy: 'Rhowch enw cyfreithiol llawn eich sefydliad'
                    })
                }
            ]
        }),
        organisationTradingName: new TextField({
            name: 'organisationTradingName',
            label: localise({
                en: 'Organisation trading name',
                cy: ''
            }),
            explanation: localise({
                en: oneLine`If your organisation uses a different name in your
                    day-to-day work, please write it below`,
                cy: ``
            }),
            isRequired: false
        }),
        organisationAddress: {
            name: 'organisationAddress',
            schema: Joi.ukAddress().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a full UK address',
                        cy: 'Rhowch gyfeiriad Prydeinig llawn'
                    })
                },
                {
                    type: 'any.empty',
                    key: 'line1',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: 'Rhowch adeilad a stryd'
                    })
                },
                {
                    type: 'any.empty',
                    key: 'townCity',
                    message: localise({
                        en: 'Enter a town or city',
                        cy: 'Rhowch dref neu ddinas'
                    })
                },
                {
                    type: 'any.empty',
                    key: 'postcode',
                    message: localise({
                        en: 'Enter a postcode',
                        cy: 'Rhowch gôd post'
                    })
                },
                {
                    type: 'string.postcode',
                    key: 'postcode',
                    message: localise({
                        en: 'Enter a real postcode',
                        cy: 'Rhowch gôd post go iawn'
                    })
                }
            ]
        },
        organisationType: {
            name: 'organisationType',
            schema: Joi.string().required(),
            messages: []
        },
        organisationBackground: {
            name: 'organisationBackground',
            schema: Joi.string()
                .minWords(50)
                .maxWords(500)
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us about your organisation`,
                        cy: ``
                    })
                },
                {
                    type: 'string.minWords',
                    message: localise({
                        en: `Answer must be at least 50 words`,
                        cy: `Rhaid i’r ateb fod yn o leiaf 50 gair`
                    })
                },
                {
                    type: 'string.maxWords',
                    message: localise({
                        en: `Answer must be no more than 500 words`,
                        cy: `Rhaid i’r ateb fod yn llai na 500 gair`
                    })
                }
            ]
        },
        contactName: {
            name: 'contactName',
            schema: Joi.fullName().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter first and last name',
                        cy: 'Rhowch enw cyntaf a chyfenw'
                    })
                },
                {
                    type: 'any.empty',
                    key: 'firstName',
                    message: localise({
                        en: 'Enter first name',
                        cy: 'Rhowch enw cyntaf'
                    })
                },
                {
                    type: 'any.empty',
                    key: 'lastName',
                    message: localise({
                        en: 'Enter last name',
                        cy: 'Rhowch gyfenw'
                    })
                }
            ]
        },
        contactEmail: new EmailField({
            name: 'contactEmail',
            label: localise({
                en: 'Email',
                cy: ``
            })
        }),
        contactPhone: new PhoneField({
            name: 'contactPhone',
            label: localise({
                en: `Telephone number`,
                cy: ``
            })
        })
    };

    function stepProjectCountry() {
        return {
            title: localise({ en: 'Project country', cy: '' }),
            noValidate: true,
            fieldsets: [
                {
                    legend: localise({ en: 'Project country', cy: '' }),
                    fields: [allFields.projectCountry]
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
                steps: [stepProjectCountry()]
            }
        ]
    };

    return new FormModel(form, data, locale);
};
