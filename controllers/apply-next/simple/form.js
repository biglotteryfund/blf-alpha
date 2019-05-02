'use strict';
const { get } = require('lodash/fp');
const { castArray, kebabCase, includes, reduce, values } = require('lodash');
const moment = require('moment');

const { Joi, ...commonValidators } = require('../lib/validators');
const enrichForm = require('../lib/enrich-form');
const {
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    MAX_BUDGET_TOTAL_GBP,
    ORGANISATION_TYPES,
    LOCAL_AUTHORITIES,
    BENEFICIARY_GROUPS
} = require('./constants');

module.exports = function({ locale, data = {} }) {
    const localise = get(locale);
    const currentOrganisationType = get('organisation-type')(data);

    function matchesOrganisationType(type) {
        return currentOrganisationType === type;
    }

    function matchesOrganisationTypes(types) {
        return includes(types, currentOrganisationType);
    }

    function emailField(props) {
        const defaultProps = {
            label: localise({ en: 'Email', cy: '' }),
            type: 'email',
            attributes: { autocomplete: 'email' },
            isRequired: true,
            schema: Joi.string()
                .email()
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter an email address', cy: '' })
                },
                {
                    type: 'string.email',
                    message: localise({
                        en: 'Email address must be in the correct format, like name@example.com',
                        cy: ''
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function phoneField(props) {
        const defaultProps = {
            type: 'tel',
            attributes: {
                size: 30,
                autocomplete: 'tel'
            },
            isRequired: true,
            schema: Joi.string()
                .phoneNumber({ defaultCountry: 'GB', format: 'national' })
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a UK telephone number',
                        cy: ''
                    })
                },
                {
                    type: 'string.phonenumber',
                    message: localise({
                        en: 'Enter a real UK telephone number',
                        cy: ''
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function addressField(props) {
        const defaultProps = {
            type: 'address',
            isRequired: true,
            schema: commonValidators.ukAddress().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a full UK address', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'building-street',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'town-city',
                    message: localise({ en: 'Enter a town or city', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'county',
                    message: localise({ en: 'Enter a county', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'postcode',
                    message: localise({ en: 'Enter a postcode', cy: '' })
                },
                {
                    type: 'string.regex.base',
                    key: 'postcode',
                    message: localise({ en: 'Enter a real postcode', cy: '' })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function addressHistoryField(props) {
        const defaultProps = {
            type: 'address-history',
            isRequired: true,
            schema: Joi.object({
                'current-address-meets-minimum': Joi.string()
                    .valid(['yes', 'no'])
                    .required(),
                'previous-address': Joi.when(Joi.ref('current-address-meets-minimum'), {
                    is: 'no',
                    then: commonValidators.ukAddress().required(),
                    otherwise: Joi.any()
                })
            }).when(Joi.ref('organisation-type'), {
                is: Joi.valid(ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY),
                then: Joi.any().optional()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a full UK address', cy: '' })
                },
                {
                    type: 'any.required',
                    key: 'current-address-meets-minimum',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'building-street',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'town-city',
                    message: localise({ en: 'Enter a town or city', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'county',
                    message: localise({ en: 'Enter a county', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'postcode',
                    message: localise({ en: 'Enter a postcode', cy: '' })
                },
                {
                    type: 'string.regex.base',
                    key: 'postcode',
                    message: localise({ en: 'Enter a real postcode', cy: '' })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function firstNameField(props) {
        const defaultProps = {
            type: 'text',
            attributes: {
                autocomplete: 'given-name',
                spellcheck: 'false'
            },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter first name', cy: '' })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function lastNameField(props) {
        const defaultProps = {
            type: 'text',
            attributes: {
                autocomplete: 'familiy-name',
                spellcheck: 'false'
            },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter last name', cy: '' })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function dateOfBirthField(minAge, props) {
        const defaultProps = {
            explanation: localise({
                en: `It's important to make sure the date of birth is correct, as errors will fail our authenticity checks and delay your application.`,
                cy: ''
            }),
            type: 'date',
            attributes: {
                max: moment()
                    .subtract(minAge, 'years')
                    .format('YYYY-MM-DD')
            },
            isRequired: true,
            schema: commonValidators
                .dateOfBirth(minAge)
                .required()
                .when(Joi.ref('organisation-type'), {
                    is: Joi.valid(ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY),
                    then: Joi.any().optional()
                }),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a date of birth', cy: '' })
                },
                {
                    type: 'any.invalid',
                    message: localise({ en: 'Enter a real date', cy: '' })
                },
                {
                    type: 'dateParts.dob',
                    message: localise({
                        en: `Must be at least ${minAge} years old`,
                        cy: ''
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function communicationNeedsField(props) {
        const defaultProps = {
            type: 'radio',
            options: [
                {
                    value: 'audiotape',
                    label: localise({ en: 'Audiotape', cy: '' })
                },
                {
                    value: 'braille',
                    label: localise({ en: 'Braille', cy: '' })
                },
                { value: 'disk', label: localise({ en: 'Disk', cy: '' }) },
                {
                    value: 'large-print',
                    label: localise({ en: 'Large print', cy: '' })
                },
                { value: 'letter', label: localise({ en: 'Letter', cy: '' }) },
                {
                    value: 'sign-language',
                    label: localise({ en: 'Sign language', cy: '' })
                },
                {
                    value: 'text-relay',
                    label: localise({ en: 'Text relay', cy: '' })
                }
            ],
            get schema() {
                return Joi.array()
                    .items(Joi.string().valid(this.options.map(option => option.value)))
                    .single()
                    .optional();
            },
            messages: [
                {
                    type: 'any.allowOnly',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function organisationTypeField() {
        return {
            name: 'organisation-type',
            label: localise({
                en: 'What type of organisation are you?',
                cy: ''
            }),
            type: 'radio',
            options: [
                {
                    value: ORGANISATION_TYPES.UNREGISTERED_VCO,
                    label: localise({
                        en: 'Unregistered voluntary or community organisation',
                        cy: ''
                    }),
                    explanation: localise({
                        en: `<p>My organisation has been set up with a governing document such as a constitution but <strong>is not</strong> a registered charity or company, such as a Scouts group, sports club, community group or residents association</p>`,
                        cy: ``
                    })
                },
                {
                    value: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                    label: localise({
                        en: 'Registered charity (unincorporated)',
                        cy: ''
                    }),
                    explanation: localise({
                        en: `<p>My organisation is a voluntary or community organisaton and is a registered charity, but <strong>is not</strong> a company registered with Companies House</p>`,
                        cy: ``
                    })
                },
                {
                    value: ORGANISATION_TYPES.CIO,
                    label: localise({
                        en: 'Charitable incorporated organisation (CIO)',
                        cy: ''
                    }),
                    explanation: localise({
                        en: `<p>My organisation is a registered charity with limited liability, but <strong>is not</strong> a company registered with Companies House</p>`,
                        cy: ``
                    })
                },
                {
                    value: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                    label: localise({ en: 'Not-for-profit company', cy: '' }),
                    explanation: localise({
                        en: `<p>My organisation is a not-for-profit company registered with Companies House, and <strong>may also</strong> be regisered as a charity</p>`,
                        cy: ``
                    })
                },
                {
                    value: ORGANISATION_TYPES.SCHOOL,
                    label: localise({
                        en: 'School or educational body',
                        cy: ''
                    }),
                    explanation: localise({
                        en: `<p>My organisation is a school, college, university, or other registered educational establishment</p>`,
                        cy: ``
                    })
                },
                {
                    value: ORGANISATION_TYPES.STATUTORY_BODY,
                    label: localise({ en: 'Statutory body', cy: '' }),
                    explanation: localise({
                        en: `<p>My organsation is a public body, such as a local authority, parsih council, or police or health authority</p>`,
                        cy: ''
                    })
                }
            ],
            isRequired: true,
            get schema() {
                return Joi.string()
                    .valid(this.options.map(option => option.value))
                    .required();
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose a type of organisation',
                        cy: ''
                    })
                }
            ]
        };
    }

    function seniorContactRoleField() {
        function rolesFor(organisationType) {
            const ROLES = {
                TRUSTEE: {
                    value: 'trustee',
                    label: localise({ en: 'Trustee', cy: '' })
                },
                CHAIR: {
                    value: 'chair',
                    label: localise({ en: 'Chair', cy: '' })
                },
                VICE_CHAIR: {
                    value: 'vice-chair',
                    label: localise({ en: 'Vice-chair', cy: '' })
                },
                SECRETARY: {
                    value: 'secretary',
                    label: localise({ en: 'Secretary', cy: '' })
                },
                TREASURER: {
                    value: 'treasurer',
                    label: localise({ en: 'Treasurer', cy: '' })
                },
                COMPANY_DIRECTOR: {
                    value: 'company-director',
                    label: localise({ en: 'Company Director', cy: '' })
                },
                COMPANY_SECRETARY: {
                    value: 'company-secretary',
                    label: localise({ en: 'Company Secretary', cy: '' })
                },
                CHIEF_EXECUTIVE: {
                    value: 'chief-executive',
                    label: localise({ en: 'Chief Executive', cy: '' })
                },
                CHIEF_EXECUTIVE_OFFICER: {
                    value: 'chief-executive-officer',
                    label: localise({ en: 'Chief Executive Officer', cy: '' })
                },
                PARISH_CLERK: {
                    value: 'parish-clerk',
                    label: localise({ en: 'Parish Clerk', cy: '' })
                },
                HEAD_TEACHER: {
                    value: 'head-teacher',
                    label: localise({ en: 'Head Teacher', cy: '' })
                },
                CHANCELLOR: {
                    value: 'chancellor',
                    label: localise({ en: 'Chancellor', cy: '' })
                },
                VICE_CHANCELLOR: {
                    value: 'vice-chancellor',
                    label: localise({ en: 'Vice-chancellor', cy: '' })
                }
            };

            let options = [];
            switch (organisationType) {
                case ORGANISATION_TYPES.UNREGISTERED_VCO:
                    options = [ROLES.CHAIR, ROLES.VICE_CHAIR, ROLES.SECRETARY, ROLES.TREASURER];
                    break;
                case ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY:
                    options = [ROLES.TRUSTEE, ROLES.CHAIR, ROLES.VICE_CHAIR, ROLES.TREASURER];
                    break;
                case ORGANISATION_TYPES.CIO:
                    options = [
                        ROLES.TRUSTEE,
                        ROLES.CHAIR,
                        ROLES.VICE_CHAIR,
                        ROLES.TREASURER,
                        ROLES.CHIEF_EXECUTIVE_OFFICER
                    ];
                    break;
                case ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY:
                    options = [ROLES.COMPANY_DIRECTOR, ROLES.COMPANY_SECRETARY];
                    break;
                case ORGANISATION_TYPES.SCHOOL:
                    options = [ROLES.HEAD_TEACHER, ROLES.CHANCELLOR, ROLES.VICE_CHANCELLOR];
                    break;
                case ORGANISATION_TYPES.STATUTORY_BODY:
                    options = [ROLES.PARISH_CLERK, ROLES.CHIEF_EXECUTIVE];
                    break;
                default:
                    options = values(ROLES);
                    break;
            }

            return options;
        }

        return {
            name: 'senior-contact-role',
            label: localise({ en: 'Role', cy: '' }),
            get explanation() {
                let text = localise({
                    en: `<p>The position held by the senior contact is dependent on the type of organisation you are applying on behalf of. The options given to you for selection are based on this.<p>`,
                    cy: ''
                });

                if (matchesOrganisationType(ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY)) {
                    text += localise({
                        en: `<p><strong>
                            As a registered charity, your senior contact must be one of your organisation's trustees. This can include trustees taking on the role of Chair, Vice Chair or Treasurer.
                        </strong></p>`
                    });
                } else if (matchesOrganisationType(ORGANISATION_TYPES.CIO)) {
                    text += localise({
                        en: `<p><strong>
                            As a charity, your senior contact can be one of your organisation's trustees.
                            This can include trustees taking on the role of Chair, Vice Chair or Treasurer.
                        </strong></p>`
                    });
                }

                return text;
            },
            type: 'radio',
            options: rolesFor(currentOrganisationType),
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Choose a role', cy: '' })
                }
            ]
        };
    }

    const allFields = {
        projectName: {
            name: 'project-name',
            label: localise({
                en: 'What is the name of your project?',
                cy: ''
            }),
            explanation: localise({
                en: 'The project name should be simple and to the point',
                cy: ''
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a project name', cy: '' })
                }
            ]
        },
        projectCountry: {
            name: 'project-country',
            label: localise({
                en: 'What country will your project be based in?',
                cy: ''
            }),
            explanation: localise({
                en: `We work slightly differently depending on which country your project is based in, to meet local needs and the regulations that apply there.`,
                cy: ''
            }),
            type: 'radio',
            options: [
                {
                    value: 'england',
                    label: localise({ en: 'England', cy: '' })
                },
                {
                    value: 'northern-ireland',
                    label: localise({ en: 'Northern Ireland', cy: '' })
                },
                {
                    value: 'scotland',
                    label: localise({ en: 'Scotland', cy: '' })
                },
                { value: 'wales', label: localise({ en: 'Wales', cy: '' }) }
            ],
            isRequired: true,
            get schema() {
                return Joi.string()
                    .valid(this.options.map(option => option.value))
                    .required();
            },
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Choose a country', cy: '' })
                }
            ]
        },
        projectStartDate: {
            name: 'project-start-date',
            label: localise({
                en: 'When is the planned (or estimated) start date of your project?',
                cy: '(WELSH) When is the planned (or estimated) start date of your project?'
            }),
            get settings() {
                const dt = moment().add(12, 'weeks');
                return {
                    minDateExample: dt.format('DD MM YYYY'),
                    fromDateExample: dt.subtract(1, 'days').format('D MMMM YYYY'),
                    minYear: dt.format('YYYY')
                };
            },
            get explanation() {
                return localise({
                    en: `<p>This date needs to be at least 12 weeks from when you plan to submit your application. If your project is a one-off event, please tell us the date of the event.</p>
                <p><strong>For example: ${this.settings.minDateExample}</strong></p>`,
                    cy: ''
                });
            },
            type: 'date',
            isRequired: true,
            schema: commonValidators.futureDate({
                amount: '12',
                unit: 'weeks'
            }),
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({ en: 'Enter a date', cy: '' })
                    },
                    {
                        type: 'any.invalid',
                        message: localise({ en: 'Enter a real date', cy: '' })
                    },
                    {
                        type: 'dateParts.futureDate',
                        message: localise({
                            en: `Date you start the project must be after ${this.settings.fromDateExample}`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        projectPostcode: {
            name: 'project-postcode',
            label: localise({
                en: 'What is the postcode of the location where your project will take place?',
                cy: ''
            }),
            explanation: localise({
                en: `If your project will take place across different locations, please use the postcode where most of the project will take place.`,
                cy: ''
            }),
            type: 'text',
            attributes: {
                size: 10,
                autocomplete: 'postal-code'
            },
            isRequired: true,
            schema: commonValidators.postcode().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a real postcode', cy: '' })
                }
            ]
        },
        yourIdeaProject: {
            name: 'your-idea-project',
            label: localise({
                en: 'What would you like to do?',
                cy: ''
            }),
            explanation: localise({
                en: `
            <p><strong>Here are some ideas of what to tell us about your project:</strong></p>
            <ul>
                <li>What you would like to do</li>
                <li>What difference your project will make</li>
                <li>Who will benefit from it</li>
                <li>How long you expect to run it for. This can be an estimate</li>
                <li>How you will make sure people know about it and will benefit from it</li>
                <li>How you plan to learn from it and use this learning to shape future projects</li>
                <li>Is it something new, or are you continuing something that has worked well previously? We want to fund both types of projects</li>
            </ul>`,
                cy: 'TODO'
            }),
            type: 'textarea',
            settings: {
                showWordCount: true,
                minWords: 50,
                maxWords: 300,
                recommendedWords: 250
            },
            attributes: { rows: 20 },
            isRequired: true,
            get schema() {
                return Joi.string()
                    .minWords(this.settings.minWords)
                    .maxWords(this.settings.maxWords)
                    .required();
            },
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({
                            en: 'Tell us about your project',
                            cy: ''
                        })
                    },
                    {
                        type: 'string.minWords',
                        message: localise({
                            en: `Answer must be at least ${this.settings.minWords} words`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.maxWords',
                        message: localise({
                            en: `Answer must be no more than ${this.settings.maxWords} words`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        yourIdeaPriorities: {
            name: 'your-idea-priorities',
            label: localise({
                en: 'How does your project meet at least one of our funding priorities?',
                cy: ''
            }),
            explanation: localise({
                en: `
            <p>National Lottery Awards for All has three funding priorities, please tell us how your project will <strong>meet at least one of these:</strong></p>
            <ol>
                <li>bring people together and build strong relationships in and across communities</li>
                <li>improve the places and spaces that matter to communities</li>
                <li>help more people to reach their potential, by supporting them at the earliest possible stage</li>
            </ol>
            <p>You can tell us if your project meets more than one priority, but don't worry if it doesn't.</p>`,
                cy: ''
            }),
            type: 'textarea',
            settings: {
                showWordCount: true,
                minWords: 50,
                maxWords: 150,
                recommendedWords: 100
            },
            attributes: {
                rows: 12
            },
            isRequired: true,
            get schema() {
                return Joi.string()
                    .minWords(this.settings.minWords)
                    .maxWords(this.settings.maxWords)
                    .required();
            },
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({
                            en: 'Tell us how your project meet at least one of our funding priorities',
                            cy: ''
                        })
                    },
                    {
                        type: 'string.minWords',
                        message: localise({
                            en: `Answer must be at least ${this.settings.minWords} words`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.maxWords',
                        message: localise({
                            en: `Answer must be no more than ${this.settings.maxWords} words`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        yourIdeaCommunity: {
            name: 'your-idea-community',
            label: localise({
                en: 'How does your project involve your community?',
                cy: ''
            }),
            explanation: localise({
                en: `
            <details>
                <summary>What do we mean by 'community'?</summary>
                <ol>
                    <li>People living in the same area</li>
                    <li>People who have similar interests or life experiences, but might not live in the same area</li>
                    <li>We don't think of a school or club as a community, but will fund a project run by one of these organisations that also benefits the communities around it</li>
                </ol>
            </details>

            <p>We believe that people understand what's needed in their communities better than anyone. Tell us how your community came up with the idea for your project, and how they will be involved in the development and delivery of the project you're planning.</p>
            <p><strong>Here are some examples of how you could be involving your community:</strong></p>
            <ul>
                <li>Having regular chats with community members, in person or on social media</li>
                <li>Including community members on your board or committee</li>
                <li>Regular surveys</li>
                <li>Setting up steering groups</li>
                <li>Running open days</li>
            </ul>`,
                cy: ''
            }),
            type: 'textarea',
            settings: {
                showWordCount: true,
                minWords: 50,
                maxWords: 200,
                recommendedWords: 150
            },
            attributes: { rows: 15 },
            isRequired: true,
            get schema() {
                return Joi.string()
                    .minWords(this.settings.minWords)
                    .maxWords(this.settings.maxWords)
                    .required();
            },
            get messages() {
                return [
                    {
                        type: 'base',
                        message: localise({
                            en: 'Tell us how your project involves your community',
                            cy: ''
                        })
                    },
                    {
                        type: 'string.minWords',
                        message: localise({
                            en: `Answer must be at least ${this.settings.minWords} words`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.maxWords',
                        message: localise({
                            en: `Answer must be no more than ${this.settings.maxWords} words`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        projectBudget: {
            name: 'project-budget',
            label: localise({
                en: 'List the costs you would like us to fund',
                cy: ''
            }),
            explanation: localise({
                en: `<p>You should use budget headings, rather than a detailed list of items. For example, if you're applying for pens, pencils, paper and envelopes, using 'office supplies' is fine.</p>
                <p>Please note you can only have a maximum of 10 rows</p>`,
                cy: ''
            }),
            type: 'budget',
            attributes: {
                max: MAX_BUDGET_TOTAL_GBP,
                rowLimit: 10
            },
            isRequired: true,
            schema: commonValidators.budgetField(MAX_BUDGET_TOTAL_GBP),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a project budget', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'item',
                    message: localise({
                        en: 'Enter an item or activity',
                        cy: ''
                    })
                },
                {
                    type: 'number.base',
                    key: 'cost',
                    message: localise({ en: 'Enter an amount', cy: '' })
                },
                {
                    type: 'budgetItems.overBudget',
                    message: localise({
                        en: `Total project costs must be less than £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}`,
                        cy: ``
                    })
                }
            ]
        },
        projectTotalCosts: {
            name: 'project-total-costs',
            label: localise({
                en: 'Tell us the total cost of your project.',
                cy: '(WELSH) Tell us the total cost of your project.'
            }),
            explanation: localise({
                en: `
            <p>This is the cost of everything related to your project, even things you aren't asking us to fund.</p>

            <p>For example, if you are asking us for £8,000 and you are getting £10,000 from another funder to cover additional costs, then your total project cost is £18,000. If you are asking us for £8,000 and there are no other costs then your total project cost is £8,000.</p>
            `,
                cy: 'TODO'
            }),
            type: 'currency',
            isRequired: true,
            schema: Joi.budgetTotalCosts().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a total cost for your project',
                        cy: ''
                    })
                },
                {
                    type: 'number.base',
                    message: localise({
                        en: 'Total cost must be a real number',
                        cy: ''
                    })
                },
                {
                    type: 'budgetTotalCosts.underBudget',
                    message: localise({
                        en: 'Total cost must be the same as or higher than the amount you’re asking us to fund',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesNumberOfPeople: {
            name: 'beneficiaries-number-of-people',
            label: localise({
                en: 'How many people will benefit from your project?',
                cy: ''
            }),
            explanation: localise({
                en: `Please enter the exact figure, or the closest estimate.`,
                cy: ``
            }),
            type: 'number',
            isRequired: true,
            schema: Joi.number()
                .min(1)
                .required(),
            messages: [{ type: 'base', message: localise({ en: 'Enter a number', cy: '' }) }]
        },
        beneficiariesLocationCheck: {
            name: 'beneficiaries-location-check',
            label: localise({
                en: 'Do the people who will benefit from your project live in a specific local authority?',
                cy: ''
            }),
            type: 'radio',
            options: [
                { value: 'yes', label: localise({ en: 'Yes', cy: '' }) },
                { value: 'no', label: localise({ en: 'No', cy: '' }) }
            ],
            isRequired: true,
            get schema() {
                return Joi.string()
                    .valid(this.options.map(option => option.value))
                    .required();
            },
            messages: [{ type: 'base', message: localise({ en: 'Choose an option', cy: '' }) }]
        },
        beneficiariesLocalAuthority: {
            name: 'beneficiaries-local-authority',
            label: localise({
                en: 'Which local authority will your project benefit?',
                cy: ''
            }),
            type: 'select',
            defaultOption: localise({ en: 'Select a local authority', cy: '' }),
            options: LOCAL_AUTHORITIES.map(localAuthority => ({
                label: localAuthority,
                value: kebabCase(localAuthority)
            })),
            isRequired: true,
            get schema() {
                return Joi.when('beneficiaries-location-check', {
                    is: 'yes',
                    then: Joi.string()
                        .valid(this.options.map(option => option.value))
                        .required()
                });
            },
            messages: [{ type: 'base', message: localise({ en: 'Choose an option', cy: '' }) }]
        },
        beneficiariesLocationDescription: {
            name: 'beneficiaries-location-description',
            label: localise({
                en: 'Tell us the town(s), village(s) or ward(s) where your beneficaries live.',
                cy: ''
            }),
            explanation: localise({
                en: `You can write more than one area.`,
                cy: ``
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.when('beneficiaries-location-check', {
                is: 'yes',
                then: Joi.string().required()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a description', cy: '' })
                }
            ]
        },
        beneficariesGroups: {
            name: 'beneficiaries-groups',
            label: localise({
                en: 'What specific group of people is your activity targeted at?',
                cy: ''
            }),
            type: 'checkbox',
            options: [
                {
                    value: BENEFICIARY_GROUPS.EVERYONE,
                    label: localise({ en: 'Everyone', cy: '' })
                },
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({ en: 'Ethnic background', cy: '' })
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({ en: 'Gender', cy: '' })
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({ en: 'Age', cy: '' })
                },
                {
                    value: BENEFICIARY_GROUPS.DISABILITY,
                    label: localise({ en: 'Disabled people', cy: '' })
                },
                {
                    value: BENEFICIARY_GROUPS.FAITH,
                    label: localise({ en: 'Religion or belief', cy: '' })
                },
                {
                    value: BENEFICIARY_GROUPS.LGBTQ,
                    label: localise({ en: 'Lesbians, gay or bisexual people', cy: '' })
                }
            ],
            get schema() {
                return commonValidators.multiCheckbox(this.options);
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsOther: {
            name: 'beneficiaries-groups-other',
            label: localise({ en: 'Other', cy: '' }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        beneficiariesGroupsGender: {
            name: 'beneficiaries-groups-gender',
            label: localise({
                en: `You have indicated that your project mostly benefits people of a particular gender, please select from the following`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                { value: 'male', label: localise({ en: 'Male', cy: '' }) },
                { value: 'female', label: localise({ en: 'Female', cy: '' }) },
                { value: 'trans', label: localise({ en: 'Trans', cy: '' }) },
                { value: 'non-binary', label: localise({ en: 'Non-binary', cy: '' }) },
                { value: 'intersex', label: localise({ en: 'Intersex', cy: '' }) }
            ],
            get schema() {
                return Joi.when('beneficiaries-groups', {
                    is: Joi.valid(BENEFICIARY_GROUPS.GENDER),
                    then: commonValidators.multiCheckbox(this.options)
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsAge: {
            name: 'beneficiaries-groups-age',
            label: localise({
                en: `You have indicated that your project mostly benefits people from particular age groups, please select from the following`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                { value: '0-12', label: localise({ en: '0–12', cy: '' }) },
                { value: '13-24', label: localise({ en: '13-24', cy: '' }) },
                { value: '25-64', label: localise({ en: '25-64', cy: '' }) },
                { value: '65-plus', label: localise({ en: '65+', cy: '' }) }
            ],
            get schema() {
                return Joi.when('beneficiaries-groups', {
                    is: Joi.valid(BENEFICIARY_GROUPS.GENDER),
                    then: commonValidators.multiCheckbox(this.options)
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsDisability: {
            name: 'beneficiaries-groups-disability',
            label: localise({
                en: `You have indicated that your project mostly benefits disabled people, please select from the following`,
                cy: ''
            }),
            explanation: localise({
                en: `We use the definition from the Equality Act 2010, which defines a disabled person as someone who has a mental or physical impairment that has a substantial and long-term adverse effect on their ability to carry out normal day to day activity.`,
                cy: ``
            }),

            type: 'checkbox',
            options: [
                {
                    value: 'sensory',
                    label: localise({
                        en: 'Disabled people with sensory impairments',
                        cy: ''
                    }),
                    explanation: localise({
                        en: 'e.g. visual and hearing impairments',
                        cy: ''
                    })
                },
                {
                    value: 'physical',
                    label: localise({
                        en: `Disabled people with physical impairments`,
                        cy: ``
                    }),
                    explanation: localise({
                        en: `e.g. neuromotor impairments, such as epilepsy and cerebral palsy, or muscular/skeletal conditions, such as missing limbs and arthritis`,
                        cy: ''
                    })
                },
                {
                    value: 'learning',
                    label: localise({
                        en: `Disabled people with learning or mental difficulties`,
                        cy: ''
                    }),
                    explanation: localise({
                        en: `e.g. reduced intellectual ability and difficulty with everyday activities or conditions such as autism`,
                        cy: ''
                    })
                }
            ],
            get schema() {
                return Joi.when('beneficiaries-groups', {
                    is: Joi.valid(BENEFICIARY_GROUPS.GENDER),
                    then: commonValidators.multiCheckbox(this.options)
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsFaith: {
            name: 'beneficiaries-groups-faith',
            label: localise({
                en: `You have indicated that your project mostly benefits people of a particular religion or belief, please select from the following`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                { value: 'buddhist', label: localise({ en: 'Buddhist', cy: '' }) },
                { value: 'christian', label: localise({ en: 'Christian', cy: '' }) },
                { value: 'jewish', label: localise({ en: 'Jewish', cy: '' }) },
                { value: 'muslim', label: localise({ en: 'Muslim', cy: '' }) },
                { value: 'sikh', label: localise({ en: 'Sikh', cy: '' }) },
                { value: 'no-religion', label: localise({ en: 'No religion', cy: '' }) }
            ],
            get schema() {
                return Joi.when('beneficiaries-groups', {
                    is: Joi.valid(BENEFICIARY_GROUPS.GENDER),
                    then: commonValidators.multiCheckbox(this.options)
                });
            },
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                }
            ]
        },
        beneficiariesGroupsFaithOther: {
            name: 'beneficiaries-groups-faith-other',
            label: localise({ en: 'Other', cy: '' }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        organisationLegalName: {
            name: 'organisation-legal-name',
            label: localise({
                en: 'What is the full legal name of your organisation?',
                cy: '(WELSH) What is the full legal name of your organisation, as shown on your governing document?'
            }),
            explanation: localise({
                en: `
            <p>This must be as shown on your <strong>governing document</strong>. Your governing document could be called one of several things, depending on the type of organisation you're applying on behalf of. It may be called a constitution, trust deed, memorandum and articles of association, or something else entirely.</p>
            `,
                cy: ''
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter the full legal name of the organisation',
                        cy: ''
                    })
                }
            ]
        },
        organisationAlias: {
            name: 'organisation-alias',
            label: localise({
                en: 'Does your organisation use a different name in your day-to-day work?',
                cy: ''
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        organisationAddress: addressField({
            name: 'organisation-address',
            label: localise({
                en: 'What is the main or registered address of your organisation?',
                cy: ''
            })
        }),
        organisationType: organisationTypeField(),
        companyNumber: {
            name: 'company-number',
            label: localise({ en: 'Companies house number', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: Joi.when('organisation-type', {
                is: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                then: Joi.string().required()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter your organisation’s Companies House number',
                        cy: ''
                    })
                }
            ]
        },
        charityNumber: {
            name: 'charity-number',
            label: localise({ en: 'Charity registration number', cy: '' }),
            explanation: localise({
                en: `If you are registered with OSCR, you only need to provide the last five digits of your registration number.`,
                cy: ''
            }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: includes(
                [ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY, ORGANISATION_TYPES.CIO],
                currentOrganisationType
            ),
            schema: Joi.when('organisation-type', {
                is: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                then: Joi.number().required()
            }).when('organisation-type', {
                is: ORGANISATION_TYPES.CIO,
                then: Joi.number().required()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter your organisation’s charity number',
                        cy: ''
                    })
                }
            ]
        },
        educationNumber: {
            name: 'education-number',
            label: localise({ en: 'Department for Education number', cy: '' }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: true,
            schema: Joi.when('organisation-type', {
                is: ORGANISATION_TYPES.SCHOOL,
                then: Joi.string().required()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter your organisation’s Department for Education number',
                        cy: ''
                    })
                }
            ]
        },
        accountingYearDate: {
            name: 'accounting-year-date',
            label: localise({
                en: 'What is your accounting year end date?',
                cy: ''
            }),
            explanation: localise({
                en: `<p><strong>For example: 31 03</strong></p>`,
                cy: ''
            }),
            type: 'day-month',
            isRequired: true,
            schema: Joi.dayMonth().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a day and month', cy: '' })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Enter a real day and month',
                        cy: ''
                    })
                }
            ]
        },
        totalIncomeYear: {
            name: 'total-income-year',
            label: localise({
                en: 'What is your total income for the year?',
                cy: ''
            }),
            type: 'currency',
            isRequired: true,
            schema: Joi.number().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter a total income for the year',
                        cy: ''
                    })
                },
                {
                    type: 'any.invalid',
                    message: localise({
                        en: 'Total income must be a real number',
                        cy: ''
                    })
                }
            ]
        },
        mainContactFirstName: firstNameField({
            name: 'main-contact-first-name',
            label: localise({ en: 'First name', cy: '' })
        }),
        mainContactLastName: lastNameField({
            name: 'main-contact-last-name',
            label: localise({ en: 'Last name', cy: '' })
        }),
        mainContactDob: dateOfBirthField(MIN_AGE_MAIN_CONTACT, {
            name: 'main-contact-dob',
            label: localise({ en: 'Date of birth', cy: '' })
        }),
        mainContactAddress: addressField({
            name: 'main-contact-address',
            label: localise({ en: 'Current address', cy: '' }),
            schema: commonValidators.ukAddress().when(Joi.ref('organisation-type'), {
                is: Joi.valid(ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY),
                then: Joi.any().optional()
            })
        }),
        mainContactAddressHistory: addressHistoryField({
            name: 'main-contact-address-history',
            label: localise({
                en: 'Have they lived at this address for the last three years?',
                cy: ''
            })
        }),
        mainContactEmail: emailField({
            name: 'main-contact-email',
            label: localise({ en: 'Email', cy: '' }),
            explanation: localise({
                en: 'We’ll use this whenever we get in touch about the project',
                cy: ''
            })
        }),
        mainContactPhone: phoneField({
            name: 'main-contact-phone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        mainContactCommunicationNeeds: communicationNeedsField({
            name: 'main-contact-communication-needs',
            label: localise({
                en: 'Please tell us about any particular communication needs this contact has.',
                cy: ''
            })
        }),
        seniorContactFirstName: firstNameField({
            name: 'senior-contact-first-name',
            label: localise({ en: 'First name', cy: '' })
        }),
        seniorContactLastName: lastNameField({
            name: 'senior-contact-last-name',
            label: localise({ en: 'Last name', cy: '' })
        }),
        seniorContactRole: seniorContactRoleField(),
        seniorContactDob: dateOfBirthField(MIN_AGE_SENIOR_CONTACT, {
            name: 'senior-contact-dob',
            label: localise({ en: 'Date of birth', cy: '' })
        }),
        seniorContactAddress: addressField({
            name: 'senior-contact-address',
            label: localise({ en: 'Current address', cy: '' }),
            schema: commonValidators.ukAddress().when(Joi.ref('organisation-type'), {
                is: Joi.valid(ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY),
                then: Joi.any().optional()
            })
        }),
        seniorContactAddressHistory: addressHistoryField({
            name: 'senior-contact-address-history',
            label: localise({
                en: 'Have you lived at your last address for at least three years?',
                cy: ''
            })
        }),
        seniorContactEmail: emailField({
            name: 'senior-contact-email',
            label: localise({ en: 'Email', cy: '' }),
            explanation: localise({
                en: 'We’ll use this whenever we get in touch about the project',
                cy: ''
            })
        }),
        seniorContactPhone: phoneField({
            name: 'senior-contact-phone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        seniorContactCommunicationNeeds: communicationNeedsField({
            name: 'senior-contact-communication-needs',
            label: localise({
                en: 'Please tell us about any particular communication needs this contact has.',
                cy: ''
            })
        }),
        bankAccountName: {
            name: 'bank-account-name',
            label: localise({ en: 'Name on the bank account', cy: '' }),
            explanation: localise({
                en: 'Name of your organisation as it appears on your bank statement',
                cy: ''
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Enter the name on the bank account',
                        cy: ''
                    })
                }
            ]
        },
        bankSortCode: {
            name: 'bank-sort-code',
            label: localise({ en: 'Sort code', cy: '' }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a sort-code', cy: '' })
                }
            ]
        },
        bankAccountNumber: {
            name: 'bank-account-number',
            label: localise({ en: 'Account number', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter an account number', cy: '' })
                }
            ]
        },
        bankBuildingSocietyNumber: {
            name: 'bank-building-society-number',
            label: localise({
                en: 'Building society number (if applicable)',
                cy: ''
            }),
            type: 'text',
            explanation: localise({
                en: 'This is only applicable if your organisation’s account is with a building society.',
                cy: ''
            }),
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .empty(),
            messages: []
        },
        bankStatement: {
            name: 'bank-statement',
            label: localise({ en: 'Upload a bank statement', cy: '' }),
            type: 'file',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Provide a bank statement',
                        cy: ''
                    })
                }
            ]
        }
    };

    const includeAddressAndDob = !matchesOrganisationTypes([
        ORGANISATION_TYPES.SCHOOL,
        ORGANISATION_TYPES.STATUTORY_BODY
    ]);

    const sectionProject = {
        slug: 'your-project',
        title: localise({ en: 'Your Project', cy: '(WELSH) Your Project' }),
        introduction: localise({
            en: `Please tell us about your project in this section. This is the most important section when it comes to making a decision about whether you will receive funding.`,
            cy: `(WELSH) Please tell us about your project in this section. This is the most important section when it comes to making a decision about whether you will receive funding.`
        }),
        steps: [
            {
                title: localise({
                    en: 'Project details',
                    cy: '(cy) Project details'
                }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Project details', cy: '' }),
                        fields: [
                            allFields.projectName,
                            allFields.projectStartDate,
                            allFields.projectCountry,
                            allFields.projectPostcode
                        ]
                    }
                ]
            },
            {
                title: localise({ en: 'Your idea', cy: '(WELSH) Your idea' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Your idea',
                            cy: '(WELSH) Your idea'
                        }),
                        fields: [allFields.yourIdeaProject, allFields.yourIdeaPriorities, allFields.yourIdeaCommunity]
                    }
                ]
            },
            {
                title: localise({
                    en: 'Project costs',
                    cy: '(WELSH) Project costs'
                }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Project costs',
                            cy: '(WELSH) Project costs'
                        }),
                        fields: [allFields.projectBudget, allFields.projectTotalCosts]
                    }
                ]
            }
        ]
    };

    function sectionBeneficiaries() {
        function fieldsFor(type) {
            let fields;
            switch (type) {
                case BENEFICIARY_GROUPS.GENDER:
                    fields = [allFields.beneficiariesGroupsGender];
                    break;
                case BENEFICIARY_GROUPS.AGE:
                    fields = [allFields.beneficiariesGroupsAge];
                    break;
                case BENEFICIARY_GROUPS.DISABILITY:
                    fields = [allFields.beneficiariesGroupsDisability];
                    break;
                case BENEFICIARY_GROUPS.FAITH:
                    fields = [allFields.beneficiariesGroupsFaith, allFields.beneficiariesGroupsFaithOther];
                    break;
                default:
                    fields = [];
                    break;
            }

            const groupsChoices = castArray(get(allFields.beneficariesGroups.name)(data));
            const matches = includes(groupsChoices, type);

            if (matches) {
                return fields;
            } else {
                return [];
            }
        }

        return {
            slug: 'beneficiaries',
            title: localise({ en: 'Beneficiaries', cy: '' }),
            introduction: localise({
                en: `We want to hear more about the people who will benefit from your project.`,
                cy: ``
            }),
            get steps() {
                return [
                    {
                        title: localise({ en: 'Number of people', cy: '' }),
                        fieldsets: [
                            {
                                legend: localise({ en: 'Number of people', cy: '' }),
                                fields: [allFields.beneficiariesNumberOfPeople]
                            }
                        ]
                    },
                    {
                        title: localise({ en: 'Local authority', cy: '' }),
                        fieldsets: [
                            {
                                legend: localise({ en: 'Local authority', cy: '' }),
                                fields: [allFields.beneficiariesLocationCheck]
                            }
                        ]
                    },
                    {
                        title: localise({ en: 'Location', cy: '' }),
                        fieldsets: [
                            {
                                legend: localise({ en: 'Location', cy: '' }),
                                get fields() {
                                    let fields = [];
                                    if (get(allFields.beneficiariesLocationCheck.name)(data) === 'yes') {
                                        fields = [
                                            allFields.beneficiariesLocalAuthority,
                                            allFields.beneficiariesLocationDescription
                                        ];
                                    }
                                    return fields;
                                }
                            }
                        ]
                    },
                    {
                        title: localise({ en: 'Specific groups of people', cy: '' }),
                        fieldsets: [
                            {
                                legend: localise({ en: 'Specific groups of people', cy: '' }),
                                fields: [allFields.beneficariesGroups, allFields.beneficiariesGroupsOther]
                            }
                        ]
                    },
                    {
                        title: localise({ en: 'Gender', cy: '' }),
                        fieldsets: [
                            {
                                legend: localise({ en: 'Gender', cy: '' }),
                                fields: fieldsFor(BENEFICIARY_GROUPS.GENDER)
                            }
                        ]
                    },
                    {
                        title: localise({ en: 'Age', cy: '' }),
                        fieldsets: [
                            {
                                legend: localise({ en: 'Age', cy: '' }),
                                fields: fieldsFor(BENEFICIARY_GROUPS.AGE)
                            }
                        ]
                    },
                    {
                        title: localise({ en: 'Disability', cy: '' }),
                        fieldsets: [
                            {
                                legend: localise({ en: 'Disability', cy: '' }),
                                fields: fieldsFor(BENEFICIARY_GROUPS.DISABILITY)
                            }
                        ]
                    },
                    {
                        title: localise({ en: 'Religion or belief', cy: '' }),
                        fieldsets: [
                            {
                                legend: localise({ en: 'Religion or belief', cy: '' }),
                                fields: fieldsFor(BENEFICIARY_GROUPS.FAITH)
                            }
                        ]
                    }
                ];
            }
        };
    }

    const sectionOrganisation = {
        slug: 'organisation',
        title: localise({ en: 'Your organisation', cy: '' }),
        introduction: localise({
            en: `Please tell us about your organisation, including legal name, registered address and income. This helps us understand the type of organisation you are.`,
            cy: ''
        }),
        steps: [
            {
                title: localise({ en: 'Organisation details', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Organisation details',
                            cy: ''
                        }),
                        fields: [
                            allFields.organisationLegalName,
                            allFields.organisationAlias,
                            allFields.organisationAddress
                        ]
                    }
                ]
            },
            {
                title: localise({ en: 'Organisation type', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Organisation type', cy: '' }),
                        fields: [allFields.organisationType]
                    }
                ]
            },
            {
                title: localise({ en: 'Registration numbers', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Registration numbers',
                            cy: ''
                        }),
                        get fields() {
                            const fields = [];
                            if (matchesOrganisationType(ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY)) {
                                fields.push(allFields.companyNumber);
                            }

                            if (
                                matchesOrganisationTypes([
                                    ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                                    ORGANISATION_TYPES.CIO,
                                    ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
                                ])
                            ) {
                                fields.push(allFields.charityNumber);
                            }

                            if (matchesOrganisationType(ORGANISATION_TYPES.SCHOOL)) {
                                fields.push(allFields.educationNumber);
                            }

                            return fields;
                        }
                    }
                ]
            },
            {
                title: localise({ en: 'Organisation finances', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Organisation finances',
                            cy: ''
                        }),
                        fields: [allFields.accountingYearDate, allFields.totalIncomeYear]
                    }
                ]
            }
        ]
    };

    const sectionMainContact = {
        slug: 'main-contact',
        title: localise({ en: 'Main contact', cy: '' }),
        introduction: localise({
            en: `Please provide details for your main contact. This will be the first person we contact if we need to discuss your project.`,
            cy: ``
        }),
        steps: [
            {
                title: localise({ en: 'Main contact', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Who is your main contact?',
                            cy: ''
                        }),
                        introduction: localise({
                            en: `<p>
                                The main contact is the person we can get in touch with if we have any questions about your project.
                                While your main contact needs to be from the organisation applying, they don't need to hold a particular position.
                            </p>
                            <p>
                                The main contact must be unconnected to the senior contact.
                                By ‘unconnected’ we mean not related by blood, marriage,
                                in a long-term relationship or people living together at the same address.
                            </p>`,
                            cy: ''
                        }),
                        get fields() {
                            if (includeAddressAndDob) {
                                return [
                                    allFields.mainContactFirstName,
                                    allFields.mainContactLastName,
                                    allFields.mainContactDob,
                                    allFields.mainContactAddress,
                                    allFields.mainContactAddressHistory,
                                    allFields.mainContactEmail,
                                    allFields.mainContactPhone,
                                    allFields.mainContactCommunicationNeeds
                                ];
                            } else {
                                return [
                                    allFields.mainContactFirstName,
                                    allFields.mainContactLastName,
                                    allFields.mainContactEmail,
                                    allFields.mainContactPhone,
                                    allFields.mainContactCommunicationNeeds
                                ];
                            }
                        }
                    }
                ]
            }
        ]
    };

    const sectionSeniorContact = {
        slug: 'senior-contact',
        title: localise({ en: 'Senior contact', cy: '' }),
        introduction: localise({
            en: `Please provide details for your senior contact. This person will be legally responsible for the funding and must be unconnected to the main contact.`,
            cy: ``
        }),
        steps: [
            {
                title: localise({ en: 'Senior contact', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'Who is your senior contact?',
                            cy: ''
                        }),
                        introduction: localise({
                            en: `<p>Please give us the contact details of a senior member of your organisation.</p>
                            <p>Your senior contact must be at least 18 years old and is legally responsible for ensuring that this application is supported by the organisation applying, any funding is delivered as set out in the application form, and that the funded organisation meets our monitoring requirements.</p>`,
                            cy: ``
                        }),
                        get fields() {
                            if (includeAddressAndDob) {
                                return [
                                    allFields.seniorContactFirstName,
                                    allFields.seniorContactLastName,
                                    allFields.seniorContactRole,
                                    allFields.seniorContactDob,
                                    allFields.seniorContactAddress,
                                    allFields.seniorContactAddressHistory,
                                    allFields.seniorContactEmail,
                                    allFields.seniorContactPhone,
                                    allFields.seniorContactCommunicationNeeds
                                ];
                            } else {
                                return [
                                    allFields.seniorContactFirstName,
                                    allFields.seniorContactLastName,
                                    allFields.seniorContactRole,
                                    allFields.seniorContactEmail,
                                    allFields.seniorContactPhone,
                                    allFields.seniorContactCommunicationNeeds
                                ];
                            }
                        }
                    }
                ]
            }
        ]
    };

    const sectionBankDetails = {
        slug: 'bank-details',
        title: localise({ en: 'Bank details', cy: '' }),
        introduction: localise({
            en: `Please provide your bank details. Before you submit your application you will need to attach a copy of a bank statement that is less than two months old.`,
            cy: ''
        }),
        steps: [
            {
                title: localise({ en: 'Bank account', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({
                            en: 'What are your bank account details?',
                            cy: ''
                        }),
                        introduction: localise({
                            en:
                                'This should be the legal name of your organisation as it appears on your bank statement, not the name of your bank. This will usually be the same as your organisation’s name on your governing document.',
                            cy: ''
                        }),
                        fields: [
                            allFields.bankAccountName,
                            allFields.bankSortCode,
                            allFields.bankAccountNumber,
                            allFields.bankBuildingSocietyNumber
                        ]
                    }
                ]
            },
            {
                title: localise({ en: 'Bank statement', cy: '' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Bank statement', cy: '' }),
                        introduction: localise({
                            en: `
    <p><strong>You must attach your bank statement as a PDF, JPEG or PNG file. Unfortunately we can’t accept Word documents, but photos of your bank statements are absolutely fine.</strong></p>

    <p>Please make sure that we can clearly see the following on your bank statement:</p>

    <ul>
        <li>Your organisation’s legal name</li>
        <li>The address the statements are sent to</li>
        <li>The bank name</li>
        <li>Account number</li>
        <li>Sort code</li>
        <li>Date (must be within last 3 months)</li>
    </ul>

    <p>Your statement needs to be less than three months old. For bank accounts opened within the last three months, we can accept a bank welcome letter. This must confirm the date your account was opened, account name, account number and sort code.</p>

    <p>If you are a school who uses a local authority bank account, please attach a letter from the local authority that confirms your school name, the bank account name and number and sort code. The letter must be on local authority headed paper and dated. Other statutory bodies can attach a letter from their finance department that confirms the details of the bank account funding would be paid into.</p>                 
                        `,
                            cy: ''
                        }),
                        fields: [allFields.bankStatement]
                    }
                ]
            }
        ]
    };

    const termsFields = [
        {
            name: 'terms-agreement-1',
            type: 'checkbox',
            label: localise({
                en:
                    'You have been authorised by the governing body of your organisation (the board or committee that runs your organisation) to submit this application and to accept the Terms and Conditions set out above on their behalf.',
                cy: ''
            }),
            options: [{ value: 'yes', label: localise({ en: 'I agree', cy: '' }) }],
            isRequired: true
        },
        {
            name: 'terms-agreement-2',
            type: 'checkbox',
            label: localise({
                en:
                    'All the information you have provided in your application is accurate and complete; and you will notify us of any changes.',
                cy: ''
            }),
            options: [{ value: 'yes', label: localise({ en: 'I agree', cy: '' }) }],
            isRequired: true
        },
        {
            name: 'terms-agreement-3',
            type: 'checkbox',
            label: localise({
                en:
                    'You understand that we will use any personal information you have provided for the purposes described under the Data Protection Statement.',
                cy: ''
            }),
            options: [{ value: 'yes', label: localise({ en: 'I agree', cy: '' }) }],
            isRequired: true
        },
        {
            name: 'terms-agreement-4',
            type: 'checkbox',
            label: localise({
                en:
                    'If information about this application is requested under the Freedom of Information Act, we will release it in line with our Freedom of Information policy.',
                cy: ''
            }),
            options: [{ value: 'yes', label: localise({ en: 'I agree', cy: '' }) }],
            isRequired: true
        },
        {
            name: 'terms-person-name',
            label: localise({
                en: 'Full name of person completing this form',
                cy: ''
            }),
            type: 'text',
            isRequired: true,
            attributes: { autocomplete: 'name' }
        },
        {
            name: 'terms-person-position',
            label: localise({ en: 'Position in organisation', cy: '' }),
            type: 'text',
            isRequired: true,
            attributes: { autocomplete: 'position' }
        }
    ];

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

    const form = {
        id: 'awards-for-all',
        title: localise({ en: 'National Lottery Awards for All', cy: '' }),
        isBilingual: true,
        schema: schema,
        allFields: allFields,
        sections: [
            sectionProject,
            sectionBeneficiaries(),
            sectionOrganisation,
            sectionMainContact,
            sectionSeniorContact,
            sectionBankDetails
        ],
        termsFields: termsFields
    };

    return enrichForm(form, data);
};
