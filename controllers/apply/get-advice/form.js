'use strict';
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const includes = require('lodash/includes');
const { oneLine } = require('common-tags');

const Joi = require('../lib/joi-extensions');

const {
    TextField,
    TextareaField,
    EmailField,
    PhoneField,
    CurrencyField,
    RadioField,
    CheckboxField,
    SelectField
} = require('../lib/field-types');

const { FormModel } = require('../lib/form-model');
const locationsFor = require('./lib/locations');

module.exports = function({ locale = 'en', data = {} } = {}) {
    const localise = get(locale);

    const projectCountries = getOr([], 'projectCountry')(data);

    function fieldProjectCountry() {
        const options = [
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
        ];

        return new CheckboxField({
            name: 'projectCountry',
            label: localise({
                en: `What country (or countries) will your project take place in?`,
                cy: ``
            }),
            explanation: localise({
                en: oneLine`We work slightly differently depending on which
                    country your project is based in, to meet local needs
                    and the regulations that apply there.`,
                cy: oneLine`Rydym yn gweithredu ychydig yn wahanol, yn ddibynnol
                    ar pa wlad mae eich prosiect wedi’i leoli i ddiwallu
                    anghenion lleol a’r rheoliadau sy’n berthnasol yna.`
            }),
            options: options,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a country',
                        cy: 'Dewiswch wlad'
                    })
                }
            ]
        });
    }

    function fieldProjectLocation() {
        const optgroups = locationsFor(projectCountries, locale);

        return new SelectField({
            name: 'projectLocation',
            label: localise({
                en: `Where will your project take place?`,
                cy: `Lle bydd eich prosiect wedi’i leoli?`
            }),
            explanation: localise({
                en: oneLine`If your project covers more than one area please
                    tell us where most of it will take place`,
                cy: oneLine`Os yw eich prosiect mewn mwy nag un ardal, dywedwch
                    wrthym lle bydd y rhan fwyaf ohono yn cymryd lle.`
            }),
            defaultOption: localise({
                en: 'Select a location',
                cy: 'Dewiswch leoliad'
            }),
            optgroups: optgroups,
            schema: Joi.when('projectCountry', {
                is: Joi.array().min(2),
                then: Joi.any().strip(),
                otherwise: Joi.string()
                    .valid(
                        flatMap(optgroups, group => group.options).map(
                            option => option.value
                        )
                    )
                    .required()
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
        });
    }

    function fieldProjectLocationDescription() {
        return new TextField({
            name: 'projectLocationDescription',
            label: localise({
                en: 'Project location',
                cy: 'Lleoliad y prosiect'
            }),
            explanation: localise({
                en: oneLine`In your own words, describe all of the locations
                    that you'll be running your project in, e.g.
                    'Yorkshire' or 'Glasgow, Cardiff and Belfast'`,
                cy: ``
            }),
            isRequired: false
        });
    }

    function fieldProjectCosts() {
        return new CurrencyField({
            name: 'projectCosts',
            label: localise({
                en: `How much money do you want from us?`,
                cy: ``
            }),
            explanation: localise({
                en: `This can be an estimate`,
                cy: ``
            }),
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
                        en: oneLine`If you need £10,000 or less from us,
                            you can apply today to through
                            <a href="/funding/under10k">
                                National Lottery Awards for All
                            </a>.`,
                        cy: ``
                    })
                }
            ]
        });
    }

    function fieldProjectDurationYears() {
        function explanation() {
            if (includes(projectCountries, 'scotland')) {
                return localise({
                    en: `We can fund projects for three to five years`,
                    cy: ``
                });
            } else {
                return localise({
                    en: `We can fund projects for one to five years`,
                    cy: ``
                });
            }
        }

        function options() {
            if (includes(projectCountries, 'scotland')) {
                return [
                    { label: '3 years', value: 3 },
                    { label: '4 years', value: 4 },
                    { label: '5 years', value: 4 }
                ];
            } else {
                return [
                    { label: '1 year', value: 1 },
                    { label: '2 years', value: 2 },
                    { label: '3 years', value: 3 },
                    { label: '4 years', value: 4 },
                    { label: '5 years', value: 4 }
                ];
            }
        }

        return new RadioField({
            name: 'projectDurationYears',
            label: localise({
                en: `How long do you need the money for?`,
                cy: ``
            }),
            explanation: explanation(),
            options: options(),
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
        });
    }

    function fieldYourIdeaProject() {
        return new TextareaField({
            name: 'yourIdeaProject',
            label: localise({
                en: 'What would you like to do?',
                cy: `Beth yr hoffech ei wneud?`
            }),
            explanation: localise({
                en: `<p>Tell us:</p>
                <ul>
                    <li>What you would like to do</li>
                    <li>Who will benefit from it</li>
                    <li>What difference your project will make</li>
                    <li>Is it something new, or are you continuing
                        something that has worked well previously?
                        We want to fund both types of ideas</li>
                </ul>`
            }),
            type: 'textarea',
            minWords: 50,
            maxWords: 500,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us what you would like to do`,
                        cy: ``
                    })
                }
            ]
        });
    }

    function fieldYourIdeaCommunity() {
        return new TextareaField({
            name: 'yourIdeaCommunity',
            label: localise({
                en: `How does your project involve your community?`,
                cy: `Sut mae eich prosiect yn cynnwys eich cymuned?`
            }),
            labelDetails: {
                summary: localise({
                    en: `What do we mean by community?`,
                    cy: `Beth rydym yn ei olygu drwy gymuned?`
                }),
                content: localise({
                    en: `<ol>
                        <li>People living in the same area</li>
                        <li>People who have similar interests or life experiences,
                            but might not live in the same area</li>
                        <li>Even though schools can be at the heart of a
                            community—we'll only fund schools that also
                            benefit the communities around them.</li>
                    </ol>`,
                    cy: `<ol>
                        <li>Pobl yn byw yn yr un ardal</li>
                        <li>Pobl sydd â diddordebau neu brofiadau bywyd tebyg,
                            ond efallai ddim yn byw yn yr un ardal</li>
                        <li>Er gall ysgolion fod wrth wraidd cymuned—byddwn dim ond yn
                            ariannu ysgolion sydd hefyd yn rhoi budd i gymunedau o’u cwmpas.
                        </li>
                    </ol>`
                })
            },
            explanation: localise({
                en: oneLine`We believe that people understand what's needed in their
                    communities better than anyone. Tell us how your community came
                    up with the idea for your project. We want to know how many
                    people you've spoken to, and how they'll be involved in the
                    development and delivery of your project.`,
                cy: ``
            }),
            type: 'textarea',
            minWords: 50,
            maxWords: 500,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us how your project involves your community`,
                        cy: ``
                    })
                }
            ]
        });
    }

    function fieldYourIdeaActivities() {
        return new TextareaField({
            name: 'yourIdeaActivities',
            label: localise({
                en: 'How does your idea fit in with other local activities?',
                cy: ''
            }),
            labelDetails: {
                summary: localise({
                    en: `Some ideas of what to tell us about`,
                    cy: ``
                }),
                content: localise({
                    en: `<ul>
                        <li>What makes your organisation best placed to carry out the project</li>
                        <li>Any gaps in local services your work will fill</li>
                        <li>What other local activities your work will complement</li>
                        <li>What links you already have in the community
                            that will help you deliver the project</li>
                        <li>How you will work together with other organisations in your community</li>
                    </ul>`,
                    cy: ``
                })
            },
            type: 'textarea',
            minWords: 50,
            maxWords: 500,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us how your idea fits in with other local activities`,
                        cy: ``
                    })
                }
            ]
        });
    }

    function fieldOrganisationLegalName() {
        return new TextField({
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
        });
    }

    function fieldOrganisationTradingName() {
        return new TextField({
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
        });
    }

    function fieldOrganisationAddress() {
        return {
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
        };
    }

    function fieldOrganisationType() {
        return {
            name: 'organisationType',
            schema: Joi.string().required(),
            messages: []
        };
    }

    function fieldOrganisationBackground() {
        return {
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
        };
    }

    function fieldContactName() {
        return {
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
        };
    }

    function fieldContactEmail() {
        return new EmailField({
            name: 'contactEmail',
            label: localise({
                en: 'Email',
                cy: ``
            })
        });
    }

    function fieldContactPhone() {
        return new PhoneField({
            name: 'contactPhone',
            label: localise({
                en: `Telephone number`,
                cy: ``
            })
        });
    }

    const allFields = {
        projectCountry: fieldProjectCountry(),
        projectLocation: fieldProjectLocation(),
        projectLocationDescription: fieldProjectLocationDescription(),
        projectCosts: fieldProjectCosts(),
        projectDurationYears: fieldProjectDurationYears(),
        yourIdeaProject: fieldYourIdeaProject(),
        yourIdeaCommunity: fieldYourIdeaCommunity(),
        yourIdeaActivities: fieldYourIdeaActivities(),
        organisationLegalName: fieldOrganisationLegalName(),
        organisationTradingName: fieldOrganisationTradingName(),
        organisationAddress: fieldOrganisationAddress(),
        organisationType: fieldOrganisationType(),
        organisationBackground: fieldOrganisationBackground(),
        contactName: fieldContactName(),
        contactEmail: fieldContactEmail(),
        contactPhone: fieldContactPhone()
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

    function stepProjectLocation() {
        return {
            title: localise({
                en: 'Project location',
                cy: 'Lleoliad y prosiect'
            }),
            noValidate: true,
            fieldsets: [
                {
                    legend: localise({
                        en: 'Project location',
                        cy: 'Lleoliad y prosiect'
                    }),
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
                    legend: localise({
                        en: 'Project costs',
                        cy: 'Costau’r prosiect'
                    }),
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
                    legend: localise({ en: 'Your idea', cy: 'Eich syniad' }),
                    fields: [
                        allFields.yourIdeaProject,
                        allFields.yourIdeaCommunity,
                        allFields.yourIdeaActivities
                    ]
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
            }
        ]
    };

    return new FormModel(form, data, locale);
};
