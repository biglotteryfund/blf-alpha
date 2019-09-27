'use strict';
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const { oneLine } = require('common-tags');

const Joi = require('../lib/joi-extensions');

const {
    Field,
    TextareaField,
    EmailField,
    PhoneField,
    CurrencyField,
    RadioField,
    CheckboxField,
    SelectField,
    AddressField,
    NameField
} = require('../lib/field-types');

const locationsFor = require('./lib/locations');

module.exports = function fieldsFor({ locale, data = {} }) {
    const localise = get(locale);

    const projectCountries = getOr([], 'projectCountry')(data);

    function fieldProjectCountry() {
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
        return new Field({
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
            minAmount: 10000,
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
                            you can apply today through
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
        return new RadioField({
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
                { label: localise({ en: '1 years', cy: '' }), value: 1 },
                { label: localise({ en: '2 years', cy: '' }), value: 2 },
                { label: localise({ en: '3 years', cy: '' }), value: 3 },
                { label: localise({ en: '4 years', cy: '' }), value: 4 },
                { label: localise({ en: '5 years', cy: '' }), value: 5 }
            ],
            schema: Joi.when('projectCountry', {
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
            maxWords: 250,
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
        return new Field({
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
        return new Field({
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
                }
            ]
        });
    }

    function fieldOrganisationAddress() {
        return new AddressField({
            name: 'organisationAddress',
            label: localise({
                en: `What is the main or registered address of your organisation?`,
                cy: `Beth yw prif gyfeiriad neu gyfeiriad gofrestredig eich sefydliad?`
            })
        });
    }

    function fieldOrganisationType() {
        return new RadioField({
            name: 'organisationType',
            label: localise({
                en: 'What type of organisation are you?',
                cy: 'Pa fath o sefydliad ydych chi?'
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

    function fieldContactName() {
        return new NameField({
            name: 'contactName',
            label: localise({
                en: 'Your name',
                cy: ''
            })
        });
    }

    function fieldContactEmail() {
        return new EmailField({
            name: 'contactEmail',
            explanation: localise({
                en: `We’ll use this whenever we get in touch about the project`,
                cy: `Fe ddefnyddiwn hwn pryd bynnag y byddwn yn cysylltu ynglŷn â’r prosiect`
            })
        });
    }

    function fieldContactPhone() {
        return new PhoneField({
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
            name: 'contactLanguagePreference',
            label: localise({
                en: `What language should we use to contact you?`,
                cy: ``
            }),
            options: options,
            schema: Joi.when('projectCountry', {
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
        return new Field({
            name: 'contactCommunicationNeeds',
            label: localise({
                en: `Communication needs`,
                cy: ``
            }),
            explanation: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: `Dywedwch wrthym am unrhyw anghenion cyfathrebu penodol sydd gan y cyswllt hwn.`
            }),
            type: 'text',
            isRequired: false,
            messages: []
        });
    }

    return {
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
        contactName: fieldContactName(),
        contactEmail: fieldContactEmail(),
        contactPhone: fieldContactPhone(),
        contactLanguagePreference: fieldContactLanguagePreference(),
        contactCommunicationNeeds: fieldContactCommunicationNeeds()
    };
};
