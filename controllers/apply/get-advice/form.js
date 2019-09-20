'use strict';
const get = require('lodash/fp/get');
const reduce = require('lodash/reduce');
const { oneLine } = require('common-tags');

const Joi = require('../lib/joi-extensions');
const normaliseErrors = require('../lib/normalise-errors');
const { TextField } = require('../lib/field-types');

module.exports = function({ locale = 'en' } = {}) {
    const localise = get(locale);

    const allFields = {
        projectCountry: {
            name: 'projectCountry',
            schema: Joi.array()
                .items(
                    Joi.string().valid([
                        'england',
                        'scotland',
                        'northern-ireland',
                        'wales'
                    ])
                )
                .single()
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a country',
                        cy: 'Dewiswch wlad'
                    })
                }
            ]
        },
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
        contactEmail: {
            name: 'contactEmail',
            schema: Joi.string()
                .email()
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter an email address',
                        cy: 'Rhowch gyfeiriad e-bost'
                    })
                },
                {
                    type: 'string.email',
                    message: localise({
                        en: oneLine`Email address must be in the correct format,
                        like name@example.com`,
                        cy: oneLine`Rhaid i’r cyfeiriad e-bost for yn y ffurf cywir,,
                        e.e enw@example.com`
                    })
                }
            ]
        },
        contactPhone: {
            name: 'contactPhone',
            schema: Joi.string()
                .phoneNumber()
                .allow('')
                .optional(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a UK telephone number',
                        cy: 'Rhowch rif ffôn Prydeinig'
                    })
                },
                {
                    type: 'string.phonenumber',
                    message: localise({
                        en: 'Enter a real UK telephone number',
                        cy: 'Rhowch rif ffôn Prydeinig go iawn'
                    })
                }
            ]
        }
    };

    const schema = Joi.object(
        reduce(
            allFields,
            function(acc, field) {
                acc[field.name] = field.schema;
                return acc;
            },
            {}
        )
    );

    const messages = reduce(
        allFields,
        function(acc, field) {
            acc[field.name] = field.messages;
            return acc;
        },
        {}
    );

    return {
        schema,
        validate(data) {
            const validationResult = schema.validate(data, {
                abortEarly: false,
                stripUnknown: true
            });

            const normalisedMessages = normaliseErrors({
                validationError: validationResult.error,
                errorMessages: messages
            });

            // @TODO: Remove isValid? Merge validate and progress?
            const isValid =
                validationResult.error === null &&
                normalisedMessages.length === 0;

            return {
                isValid: isValid,
                value: validationResult.value,
                error: validationResult.error,
                messages: normalisedMessages
            };
        }
    };
};
