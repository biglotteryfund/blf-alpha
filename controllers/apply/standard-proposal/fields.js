'use strict';
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const orderBy = require('lodash/orderBy');
const { oneLine } = require('common-tags');
const config = require('config');

const Joi = require('../lib/joi-extensions');

const {
    Field,
    TextareaField,
    EmailField,
    PhoneField,
    CurrencyField,
    RadioField,
    SelectField,
    AddressField,
    NameField
} = require('../lib/field-types');

const { locationOptions } = require('../lib/location-options');

module.exports = function fieldsFor({ locale, data = {} }) {
    const localise = get(locale);

    const projectCountries = getOr([], 'projectCountries')(data);

    function fieldProjectName() {
        const maxLength = 80;
        return new Field({
            name: 'projectName',
            label: localise({
                en: 'What is the name of your project?',
                cy: 'Beth yw enw eich prosiect?'
            }),
            explanation: localise({
                en: 'The project name should be simple and to the point',
                cy: 'Dylai enw’r prosiect fod yn syml ac eglur'
            }),
            maxLength: maxLength,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a project name',
                        cy: 'Rhowch enw prosiect'
                    })
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Project name must be ${maxLength} characters or less`,
                        cy: `Rhaid i enw’r prosiect fod yn llai na ${maxLength} nod`
                    })
                }
            ]
        });
    }

    function fieldProjectCountries() {
        const allowedCountries = config.get(
            'standardFundingProposal.allowedCountries'
        );

        function options() {
            function label(country) {
                let result = '';
                if (country === 'england') {
                    result = localise({
                        en: 'England',
                        cy: 'Lloegr'
                    });
                } else if (country === 'scotland') {
                    result = localise({
                        en: 'Scotland',
                        cy: 'Yr Alban'
                    });
                } else if (country === 'northern-ireland') {
                    result = localise({
                        en: 'Northern Ireland',
                        cy: 'Gogledd Iwerddon'
                    });
                } else if (country === 'wales') {
                    result = localise({
                        en: 'Wales',
                        cy: 'Cymru'
                    });
                }

                if (allowedCountries.includes(country) === false) {
                    result += localise({
                        en: ' (coming soon)',
                        cy: ' (Dod yn fuan)'
                    });
                }

                return result;
            }

            const options = [
                'england',
                'scotland',
                'wales',
                'northern-ireland'
            ].map(function(country) {
                const option = { value: country, label: label(country) };

                if (allowedCountries.includes(country) === false) {
                    option.attributes = { disabled: 'disabled' };
                }

                return option;
            });

            return orderBy(
                options,
                ['attributes.disabled', 'label'],
                ['desc', 'asc']
            );
        }

        return new RadioField({
            locale: locale,
            name: 'projectCountries',
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
            options: options(),
            /**
             * Treat single options as an array to account for
             * pending proposals that used checkbox selection.
             *
             * Multiple selection disabled until UK-portfolio is enabled.
             * @TODO: Remove and switch back to checkbox when launching UK-portfolio
             */
            schema: Joi.array()
                .items(
                    Joi.string().valid(options().map(option => option.value))
                )
                .single(),
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
        function optgroups() {
            const locations = locationOptions(locale);

            if (projectCountries.length > 1) {
                return [];
            } else if (projectCountries.includes('england')) {
                return locations.england;
            } else if (projectCountries.includes('northern-ireland')) {
                return locations.northernIreland;
            } else if (projectCountries.includes('scotland')) {
                return locations.scotland;
            } else if (projectCountries.includes('wales')) {
                return locations.wales;
            } else {
                return [];
            }
        }

        return new SelectField({
            locale: locale,
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
            optgroups: optgroups(),
            schema: Joi.when('projectCountries', {
                is: Joi.array().min(2),
                then: Joi.any().strip(),
                otherwise: Joi.string()
                    .valid(
                        flatMap(optgroups(), group => group.options).map(
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
        const maxLength = 255;
        const baseSchema = Joi.string().max(maxLength);

        return new Field({
            locale: locale,
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
            isRequired: projectCountries.length > 1,
            schema: Joi.when('projectCountries', {
                is: Joi.array().min(2),
                then: baseSchema.required(),
                otherwise: baseSchema.allow('').optional()
            }),
            maxLength: maxLength,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Tell us all of the locations that you'll be running your project in`,
                        cy: ''
                    })
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Project locations must be ${maxLength} characters or less`,
                        cy: `Rhaid i leoliadau’r prosiect fod yn llai na ${maxLength} nod`
                    })
                }
            ]
        });
    }

    function fieldProjectCosts() {
        return new CurrencyField({
            locale: locale,
            name: 'projectCosts',
            label: localise({
                en: `How much money do you want from us?`,
                cy: ``
            }),
            explanation: localise({
                en: `This can be an estimate`,
                cy: ``
            }),
            minAmount: 10001,
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
                        en: oneLine`The amount you ask for must be more than £10,000.
                            If you need less than £10,000, apply today through
                            <a href="/funding/under10k">
                                National Lottery Awards for All
                            </a>`,
                        cy: ``
                    })
                }
            ]
        });
    }

    function fieldProjectDurationYears() {
        return new RadioField({
            locale: locale,
            name: 'projectDurationYears',
            label: localise({
                en: `How long do you need the money for?`,
                cy: ``
            }),
            explanation: localise({
                en: `We can fund projects for one to five years`,
                cy: ``
            }),
            options: [
                { label: localise({ en: '1 year', cy: '' }), value: 1 },
                { label: localise({ en: '2 years', cy: '' }), value: 2 },
                { label: localise({ en: '3 years', cy: '' }), value: 3 },
                { label: localise({ en: '4 years', cy: '' }), value: 4 },
                { label: localise({ en: '5 years', cy: '' }), value: 5 }
            ],
            schema: Joi.when('projectCountries', {
                is: Joi.array().min(2),
                then: Joi.any().strip(),
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
            locale: locale,
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
                        We want to fund both types of projects</li>
                </ul>`
            }),
            type: 'textarea',
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
            locale: locale,
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
            maxWords: 350,
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
        const maxLength = 255;
        return new Field({
            locale: locale,
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
            maxLength: maxLength,
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter the full legal name of the organisation',
                        cy: 'Rhowch enw cyfreithiol llawn eich sefydliad'
                    })
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Full legal name of organisation must be ${maxLength} characters or less`,
                        cy: `Rhaid i’r enw cyfreithiol llawn fod yn llai na ${maxLength} nod`
                    })
                }
            ]
        });
    }

    function fieldOrganisationTradingName() {
        const maxLength = 255;
        return new Field({
            locale: locale,
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
            isRequired: false,
            schema: Joi.string()
                .max(maxLength)
                .allow('')
                .optional()
                .invalid(Joi.ref('organisationLegalName')),
            messages: [
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Trading name must not be the same as legal name',
                        cy: ''
                    })
                },
                {
                    type: 'string.max',
                    message: localise({
                        en: `Organisation's day-to-day name must be ${maxLength} characters or less`,
                        cy: `Rhaid i enw dydd i ddydd y sefydliad fod yn llai na ${maxLength} nod`
                    })
                }
            ]
        });
    }

    function fieldOrganisationAddress() {
        return new AddressField({
            locale: locale,
            name: 'organisationAddress',
            label: localise({
                en: `What is the main or registered address of your organisation?`,
                cy: `Beth yw prif gyfeiriad neu gyfeiriad gofrestredig eich sefydliad?`
            })
        });
    }

    function fieldOrganisationType() {
        return new RadioField({
            locale: locale,
            name: 'organisationType',
            label: localise({
                en: 'What type of organisation are you?',
                cy: 'Pa fath o sefydliad ydych chi?'
            }),
            explanation: localise({
                en: `If you're both a charity and a company—just pick ‘Not-for-profit company’ below.`,
                cy: `Os ydych yn elusen ac yn gwmni—dewiswch ‘Cwmni di-elw’ isod.`
            }),
            options: [
                {
                    value: 'unregistered-vco',
                    label: localise({
                        en: `Unregistered voluntary or community organisation`,
                        cy: `Sefydliad gwirfoddol neu gymunedol anghofrestredig`
                    }),
                    explanation: localise({
                        en: oneLine`An organisation set up with a governing document
                            - like a constitution. But isn't a registered charity or company.`,
                        cy: oneLine`Sefydliad wedi’i sefydlu â dogfen lywodraethol
                            – fel cyfansoddiad. Ond nid yw’n elusen na chwmni cofrestredig.`
                    })
                },
                {
                    value: 'not-for-profit-company',
                    label: localise({
                        en: 'Not-for-profit company',
                        cy: 'Cwmni di-elw'
                    }),
                    explanation: localise({
                        en: oneLine`A company limited by guarantee - registered with Companies House. 
                            And might also be registered as a charity.`,
                        cy: oneLine`Cwmni sy’n gyfyngedig drwy warant – yn gofrestredig â Thŷ’r Cwmnïau. 
                            A gall hefyd fod wedi’i gofrestru fel elusen.`
                    })
                },
                {
                    value: 'unregistered-vco',
                    label: localise({
                        en: `Registered charity (unincorporated)`,
                        cy: `Elusen gofrestredig (anghorfforedig)`
                    }),
                    explanation: localise({
                        en: oneLine`A voluntary or community organisation that's a registered charity. 
                            But isn't a company registered with Companies House.`,
                        cy: oneLine`Sefydliad gwirfoddol neu gymunedol sydd yn elusen gofrestredig. 
                            Ond nid yw’n gwmni cofrestredig â Thŷ’r Cwmnïau.`
                    })
                },
                {
                    value: 'charitable-incorporated-organisation',
                    label: localise({
                        en: `Charitable Incorporated Organisation (CIO or SCIO)`,
                        cy: `Sefydliad corfforedig elusennol (CIO / SCIO)`
                    }),
                    explanation: localise({
                        en: oneLine`A registered charity with limited liability. 
                            But isn't a company registered with Companies House.`,
                        cy: oneLine`Elusen gofrestredig gydag atebolrwydd cyfyngedig. 
                            Ond nid yw’n gwmni cofrestredig â Thŷ’r Cwmnïau.`
                    })
                },
                {
                    value: 'community-interest-company',
                    label: localise({
                        en: 'Community Interest Company (CIC)',
                        cy: 'Cwmni Budd Cymunedol'
                    }),
                    explanation: localise({
                        en: oneLine`A company registered with Companies House. 
                    And the Community Interest Company (CIC) Regulator.`,
                        cy: oneLine`Cwmni cofrestredig â Thŷ’r Cwmnïau. A’r Rheolydd Cwmni Budd Cymunedol.`
                    })
                },
                {
                    value: 'school',
                    label: localise({
                        en: 'School',
                        cy: 'Ysgol'
                    })
                },
                {
                    value: 'college-or-university',
                    label: localise({
                        en: 'College or University',
                        cy: 'Coleg neu brifysgol'
                    })
                },
                {
                    value: 'statutory-body',
                    label: localise({
                        en: 'Statutory body',
                        cy: 'Corff statudol'
                    }),
                    explanation: localise({
                        en: oneLine`A public body - like a local authority or parish council. 
                            Or a police or health authority.`,
                        cy: oneLine`Corff cyhoeddus – fel awdurdod lleol neu gyngor plwyf. 
                            Neu awdurdod heddlu neu iechyd.`
                    })
                },
                {
                    value: 'faith-group',
                    label: localise({
                        en: 'Faith-based group',
                        cy: 'Grŵp yn seiliedig ar ffydd'
                    }),
                    explanation: localise({
                        en: `Like a church, mosque, temple or synagogue.`,
                        cy: `Fel eglwys, mosg, teml neu synagog.`
                    })
                }
            ],
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a type of organisation',
                        cy: 'Dewiswch fath o sefydliad'
                    })
                }
            ]
        });
    }

    function fieldOrganisationSubType() {
        const options = [
            {
                value: 'parish-council',
                label: localise({
                    en: 'Parish Council',
                    cy: 'Cyngor plwyf'
                })
            },
            {
                value: 'town-council',
                label: localise({
                    en: 'Town Council',
                    cy: 'Cyngor tref'
                })
            },
            {
                value: 'local-authority',
                label: localise({
                    en: 'Local Authority',
                    cy: 'Awdurdod lleol'
                })
            },
            {
                value: 'nhs-trust-health-authority',
                label: localise({
                    en: 'NHS Trust/Health Authority',
                    cy: 'Ymddiriedaeth GIG/Awdurdod Iechyd'
                })
            },
            {
                value: 'prison-service',
                label: localise({
                    en: 'Prison Service',
                    cy: 'Gwasanaeth carchar'
                })
            },
            {
                value: 'fire-service',
                label: localise({
                    en: 'Fire Service',
                    cy: 'Gwasanaeth tân'
                })
            },
            {
                value: 'police-authority',
                label: localise({
                    en: 'Police Authority',
                    cy: 'Awdurdod heddlu'
                })
            }
        ];

        return new RadioField({
            locale: locale,
            name: 'organisationSubType',
            label: localise({
                en: 'Tell us what type of statutory body you are',
                cy: 'Dywedwch wrthym pa fath o gorff statudol ydych'
            }),
            type: 'radio',
            options: options,
            isRequired: true,
            schema: Joi.when('organisationType', {
                is: 'statutory-body',
                then: Joi.string()
                    .valid(options.map(option => option.value))
                    .required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Tell us what type of statutory body you are',
                        cy: 'Dywedwch wrthym pa fath o gorff statudol ydych'
                    })
                }
            ]
        });
    }

    function fieldContactName() {
        return new NameField({
            locale: locale,
            name: 'contactName',
            label: localise({
                en: 'Your name',
                cy: ''
            })
        });
    }

    function fieldContactEmail() {
        return new EmailField({
            locale: locale,
            name: 'contactEmail',
            explanation: localise({
                en: `We’ll use this whenever we get in touch about the project`,
                cy: `Fe ddefnyddiwn hwn pryd bynnag y byddwn yn cysylltu ynglŷn â’r prosiect`
            })
        });
    }

    function fieldContactPhone() {
        return new PhoneField({
            locale: locale,
            name: 'contactPhone',
            isRequired: false
        });
    }

    function fieldContactLanguagePreference() {
        const options = [
            {
                label: localise({ en: `English`, cy: `Saesneg` }),
                value: 'english'
            },
            {
                label: localise({ en: `Welsh`, cy: `Cymraeg` }),
                value: 'welsh'
            }
        ];

        return new RadioField({
            locale: locale,
            name: 'contactLanguagePreference',
            label: localise({
                en: `What language should we use to contact you?`,
                cy: ``
            }),
            options: options,
            schema: Joi.when('projectCountries', {
                is: Joi.array()
                    .items(
                        Joi.string()
                            .only('wales')
                            .required(),
                        Joi.any()
                    )
                    .required(),
                then: Joi.string()
                    .valid(options.map(option => option.value))
                    .required(),
                otherwise: Joi.any().strip()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select a language',
                        cy: 'Dewiswch iaith'
                    })
                }
            ]
        });
    }

    function fieldContactCommunicationNeeds() {
        const maxLength = 255;
        return new Field({
            locale: locale,
            name: 'contactCommunicationNeeds',
            label: localise({
                en: `Communication needs`,
                cy: ``
            }),
            explanation: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: `Dywedwch wrthym am unrhyw anghenion cyfathrebu penodol sydd gan y cyswllt hwn.`
            }),
            isRequired: false,
            maxLength: maxLength,
            messages: [
                {
                    type: 'string.max',
                    message: localise({
                        en: `Particular communication needs must be ${maxLength} characters or less`,
                        cy: `Rhaid i’r anghenion cyfathrebu penodol fod yn llai na ${maxLength} nod`
                    })
                }
            ]
        });
    }

    return {
        projectName: fieldProjectName(),
        projectCountries: fieldProjectCountries(),
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
        organisationSubType: fieldOrganisationSubType(),
        contactName: fieldContactName(),
        contactEmail: fieldContactEmail(),
        contactPhone: fieldContactPhone(),
        contactLanguagePreference: fieldContactLanguagePreference(),
        contactCommunicationNeeds: fieldContactCommunicationNeeds()
    };
};
