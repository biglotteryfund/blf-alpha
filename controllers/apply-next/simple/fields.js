'use strict';
const moment = require('moment');
const { get } = require('lodash/fp');
const { flatMap, includes, reduce, values } = require('lodash');

const Joi = require('../joi-extensions');
const locationsFor = require('../lib/locations');
const {
    BENEFICIARY_GROUPS,
    MAX_BUDGET_TOTAL_GBP,
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    ORGANISATION_TYPES
} = require('./constants');

module.exports = function fieldsFor({ locale, data = {} }) {
    const localise = get(locale);

    const currentOrganisationType = get('organisationType')(data);

    function matchesOrganisationType(type) {
        return currentOrganisationType === type;
    }

    function multiChoice(options) {
        return Joi.array()
            .items(Joi.string().valid(options.map(option => option.value)))
            .single();
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
                        en: `Email address must be in the correct format, like name@example.com`,
                        cy: ``
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function phoneField(props) {
        const defaultProps = {
            type: 'tel',
            attributes: { size: 30, autocomplete: 'tel' },
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
            schema: Joi.ukAddress().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a full UK address', cy: '' })
                },
                {
                    type: 'any.empty',
                    key: 'line1',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'townCity',
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
                    type: 'string.postcode',
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
                currentAddressMeetsMinimum: Joi.string()
                    .valid(['yes', 'no'])
                    .required(),
                previousAddress: Joi.when(
                    Joi.ref('currentAddressMeetsMinimum'),
                    {
                        is: 'no',
                        then: Joi.ukAddress().required(),
                        otherwise: Joi.any()
                    }
                )
            }).when(Joi.ref('organisationType'), {
                is: Joi.valid(
                    ORGANISATION_TYPES.SCHOOL,
                    ORGANISATION_TYPES.STATUTORY_BODY
                ),
                then: Joi.any().optional()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a full UK address', cy: '' })
                },
                {
                    type: 'any.required',
                    key: 'currentAddressMeetsMinimum',
                    message: localise({
                        en: 'Choose from one of the options provided',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'line1',
                    message: localise({
                        en: 'Enter a building and street',
                        cy: ''
                    })
                },
                {
                    type: 'any.empty',
                    key: 'townCity',
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
                    type: 'string.postcode',
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
                autocomplete: 'family-name',
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
            schema: Joi.dateParts()
                .dob(minAge)
                .required()
                .when(Joi.ref('organisationType'), {
                    is: Joi.valid(
                        ORGANISATION_TYPES.SCHOOL,
                        ORGANISATION_TYPES.STATUTORY_BODY
                    ),
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
        const options = [
            {
                value: 'audiotape',
                label: localise({ en: 'Audiotape', cy: '' })
            },
            {
                value: 'braille',
                label: localise({ en: 'Braille', cy: '' })
            },
            {
                value: 'disk',
                label: localise({ en: 'Disk', cy: '' })
            },
            {
                value: 'large-print',
                label: localise({ en: 'Large print', cy: '' })
            },
            {
                value: 'letter',
                label: localise({ en: 'Letter', cy: '' })
            },
            {
                value: 'sign-language',
                label: localise({ en: 'Sign language', cy: '' })
            },
            {
                value: 'text-relay',
                label: localise({ en: 'Text relay', cy: '' })
            }
        ];

        const defaultProps = {
            type: 'checkbox',
            options: options,
            schema: multiChoice(options).optional(),
            messages: [
                {
                    type: 'any.allowOnly',
                    message: localise({
                        en: 'Choose from the options provided',
                        cy: ''
                    })
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function organisationTypeField() {
        const options = [
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
        ];

        return {
            name: 'organisationType',
            label: localise({
                en: 'What type of organisation are you?',
                cy: ''
            }),
            type: 'radio',
            options: options,
            isRequired: true,
            schema: Joi.string()
                .valid(options.map(option => option.value))
                .required(),
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
                    options = [
                        ROLES.CHAIR,
                        ROLES.VICE_CHAIR,
                        ROLES.SECRETARY,
                        ROLES.TREASURER
                    ];
                    break;
                case ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY:
                    options = [
                        ROLES.TRUSTEE,
                        ROLES.CHAIR,
                        ROLES.VICE_CHAIR,
                        ROLES.TREASURER
                    ];
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
                    options = [
                        ROLES.HEAD_TEACHER,
                        ROLES.CHANCELLOR,
                        ROLES.VICE_CHANCELLOR
                    ];
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
            name: 'seniorContactRole',
            label: localise({ en: 'Role', cy: '' }),
            get explanation() {
                let text = localise({
                    en: `<p>The position held by the senior contact is dependent on the type of organisation you are applying on behalf of. The options given to you for selection are based on this.<p>`,
                    cy: ''
                });

                if (
                    matchesOrganisationType(
                        ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY
                    )
                ) {
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

    function conditionalBeneficiaryChoice({ match, schema }) {
        return Joi.when(Joi.ref('beneficiariesGroupsCheck'), {
            is: 'yes',
            // Conditional based on array
            // https://github.com/hapijs/joi/issues/622
            then: Joi.when(Joi.ref('beneficiariesGroups'), {
                is: Joi.array().items(
                    Joi.string()
                        .only(match)
                        .required(),
                    Joi.any()
                ),
                then: schema,
                otherwise: Joi.any().strip()
            }),
            otherwise: Joi.any().strip()
        });
    }

    const fields = {
        projectName: {
            name: 'projectName',
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
        projectStartDate: {
            name: 'projectStartDate',
            label: localise({
                en: `When is the planned (or estimated) start date of your project?`,
                cy: ``
            }),
            get settings() {
                const dt = moment().add(12, 'weeks');
                return {
                    minDateExample: dt.format('DD MM YYYY'),
                    fromDateExample: dt
                        .subtract(1, 'days')
                        .format('D MMMM YYYY'),
                    minYear: dt.format('YYYY')
                };
            },
            get explanation() {
                return localise({
                    en: `<p>This date needs to be at least 12 weeks from when you plan to submit your application. If your project is a one-off event, please tell us the date of the event.</p>
                <p><strong>For example: ${
                    this.settings.minDateExample
                }</strong></p>`,
                    cy: ''
                });
            },
            type: 'date',
            isRequired: true,
            get schema() {
                const minDate = moment().add('12', 'weeks');
                return Joi.dateParts().futureDate(minDate.format('YYYY-MM-DD'));
            },
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
                            en: `Date you start the project must be after ${
                                this.settings.fromDateExample
                            }`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        projectCountry: {
            name: 'projectCountry',
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
        projectLocation: {
            name: 'projectLocation',
            label: localise({
                en: 'Where will your project take place?',
                cy: ''
            }),
            explanation: localise({
                en: `If your project covers more than one area please choose the primary location`,
                cy: ''
            }),
            type: 'select',
            defaultOption: localise({ en: 'Select a location', cy: '' }),
            get optgroups() {
                const country = get('projectCountry')(data);
                return locationsFor(country);
            },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Choose a location', cy: '' })
                }
            ]
        },
        projectLocationDescription: {
            name: 'projectLocationDescription',
            label: localise({
                en: `Tell us the towns, villages or wards where your beneficiaries live`,
                cy: ``
            }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a description', cy: '' })
                }
            ]
        },
        projectPostcode: {
            name: 'projectPostcode',
            label: localise({
                en: `What is the postcode of the location where your project will take place?`,
                cy: ``
            }),
            explanation: localise({
                en: `If your project will take place across different locations, please use the postcode where most of the project will take place.`,
                cy: ``
            }),
            type: 'text',
            attributes: {
                size: 10,
                autocomplete: 'postal-code'
            },
            isRequired: true,
            schema: Joi.string()
                .postcode()
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Enter a real postcode', cy: '' })
                }
            ]
        },
        yourIdeaProject: {
            name: 'yourIdeaProject',
            label: localise({
                en: 'What would you like to do?',
                cy: ''
            }),
            explanation: localise({
                en: `<p><strong>Here are some ideas of what to tell us about your project:</strong></p>
                <ul>
                    <li>What you would like to do</li>
                    <li>What difference your project will make</li>
                    <li>Who will benefit from it</li>
                    <li>How long you expect to run it for. This can be an estimate</li>
                    <li>How you will make sure people know about it and will benefit from it</li>
                    <li>How you plan to learn from it and use this learning to shape future projects</li>
                    <li>Is it something new, or are you continuing something that has worked well previously? We want to fund both types of projects</li>
                </ul>`,
                cy: ''
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
                            en: `Answer must be at least ${
                                this.settings.minWords
                            } words`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.maxWords',
                        message: localise({
                            en: `Answer must be no more than ${
                                this.settings.maxWords
                            } words`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        yourIdeaPriorities: {
            name: 'yourIdeaPriorities',
            label: localise({
                en: `How does your project meet at least one of our funding priorities?`,
                cy: ``
            }),
            explanation: localise({
                en: `<p>National Lottery Awards for All has three funding priorities, please tell us how your project will <strong>meet at least one of these:</strong></p>
                <ol>
                    <li>bring people together and build strong relationships in and across communities</li>
                    <li>improve the places and spaces that matter to communities</li>
                    <li>help more people to reach their potential, by supporting them at the earliest possible stage</li>
                </ol>
                <p>You can tell us if your project meets more than one priority, but don't worry if it doesn't.</p>`,
                cy: ``
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
                            en: `Tell us how your project meet at least one of our funding priorities`,
                            cy: ``
                        })
                    },
                    {
                        type: 'string.minWords',
                        message: localise({
                            en: `Answer must be at least ${
                                this.settings.minWords
                            } words`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.maxWords',
                        message: localise({
                            en: `Answer must be no more than ${
                                this.settings.maxWords
                            } words`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        yourIdeaCommunity: {
            name: 'yourIdeaCommunity',
            label: localise({
                en: 'How does your project involve your community?',
                cy: ''
            }),
            explanation: localise({
                en: `<p><strong>What do we mean by 'community'?</strong></p>
                <ol>
                    <li>People living in the same area</li>
                    <li>People who have similar interests or life experiences, but might not live in the same area</li>
                    <li>We don't think of a school or club as a community, but will fund a project run by one of these organisations that also benefits the communities around it</li>
                </ol>

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
                            en: `Tell us how your project involves your community`,
                            cy: ``
                        })
                    },
                    {
                        type: 'string.minWords',
                        message: localise({
                            en: `Answer must be at least ${
                                this.settings.minWords
                            } words`,
                            cy: ''
                        })
                    },
                    {
                        type: 'string.maxWords',
                        message: localise({
                            en: `Answer must be no more than ${
                                this.settings.maxWords
                            } words`,
                            cy: ''
                        })
                    }
                ];
            }
        },
        projectBudget: {
            name: 'projectBudget',
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
            schema: Joi.budgetItems()
                .maxBudget(MAX_BUDGET_TOTAL_GBP)
                .required(),
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
            name: 'projectTotalCosts',
            label: localise({
                en: 'Tell us the total cost of your project.',
                cy: '(WELSH) Tell us the total cost of your project.'
            }),
            explanation: localise({
                en: `<p>This is the cost of everything related to your project, even things you aren't asking us to fund.</p>

                <p>For example, if you are asking us for £8,000 and you are getting £10,000 from another funder to cover additional costs, then your total project cost is £18,000. If you are asking us for £8,000 and there are no other costs then your total project cost is £8,000.</p>`,
                cy: ``
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
                        en: `Total cost must be the same as or higher than the amount you’re asking us to fund`,
                        cy: ``
                    })
                }
            ]
        },
        beneficiariesGroupsCheck: {
            name: 'beneficiariesGroupsCheck',
            label: localise({
                en: `Is your project aimed at one of the following groups of people?`,
                cy: ``
            }),
            explanation: localise({
                en: `<ul>
                    <li>people of a particular ethnic background, gender, age or religious belief</li>
                    <li>disabled people</li>
                    <li>lesbian, gay or bisexual people</li>
                    <li>people with caring responsibilties</li>
                </ul>`,
                cy: ``
            }),
            type: 'radio',
            options: [
                {
                    value: 'yes',
                    label: localise({ en: 'Yes', cy: '' })
                },
                {
                    value: 'no',
                    label: localise({ en: 'No', cy: '' })
                }
            ],
            isRequired: true,
            schema: Joi.string()
                .valid(['yes', 'no'])
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({ en: 'Answer yes or no', cy: '' })
                }
            ]
        },
        beneficiariesGroups: {
            name: 'beneficiariesGroups',
            label: localise({
                en: `What specific groups of people is your project aimed at?`,
                cy: ``
            }),
            type: 'checkbox',
            options: [
                {
                    value: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    label: localise({
                        en: 'People from a particular ethnic background',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.GENDER,
                    label: localise({
                        en: 'People of a particular gender',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.AGE,
                    label: localise({
                        en: 'People of a particular age',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    label: localise({ en: 'Disabled people', cy: '' })
                },
                {
                    value: BENEFICIARY_GROUPS.RELIGION,
                    label: localise({
                        en: 'People with a particular religious belief',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.LGBT,
                    label: localise({
                        en: 'Lesbian, gay, or bisexual people',
                        cy: ''
                    })
                },
                {
                    value: BENEFICIARY_GROUPS.CARING,
                    label: localise({
                        en: `People with caring responsibilities`,
                        cy: ``
                    })
                }
            ],
            get schema() {
                return Joi.when('beneficiariesGroupsCheck', {
                    is: 'yes',
                    then: multiChoice(this.options).required(),
                    otherwise: Joi.any().strip()
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
        beneficiariesGroupsOther: {
            name: 'beneficiariesGroupsOther',
            label: localise({ en: 'Other', cy: '' }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        beneficiariesEthnicBakground: {
            name: 'beneficiariesGroupsEthnicBackground',
            label: localise({ en: `Ethnic background`, cy: '' }),
            explanation: localise({
                en: `You told us that your project mostly benefits people from a particular ethnic background. Please tell us which one(s).`,
                cy: ``
            }),
            type: 'checkbox',
            optgroups: [
                {
                    label: localise({
                        en: 'White',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'white-british',
                            label: localise({
                                en: `English / Welsh / Scottish / Northern Irish / British`,
                                cy: ''
                            })
                        },
                        {
                            value: 'irish',
                            label: localise({ en: 'Irish', cy: '' })
                        },
                        {
                            value: 'gypsy-or-irish-traveller',
                            label: localise({
                                en: 'Gypsy or Irish Traveller',
                                cy: ''
                            })
                        },
                        {
                            value: 'white-other',
                            label: localise({
                                en: 'Any other White background',
                                cy: ''
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Mixed / Multiple ethnic groups',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'mixed-background',
                            label: localise({
                                en: 'Mixed ethnic background',
                                cy: ''
                            }),
                            explanation: localise({
                                en: `this refers to people whose parents are of a different ethnic background to each other`,
                                cy: ``
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Asian / Asian British',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'indian',
                            label: localise({ en: 'Indian', cy: '' })
                        },
                        {
                            value: 'pakistani',
                            label: localise({ en: 'Pakistani', cy: '' })
                        },
                        {
                            value: 'bangladeshi',
                            label: localise({ en: 'Bangladeshi', cy: '' })
                        },
                        {
                            value: 'chinese',
                            label: localise({ en: 'Chinese', cy: '' })
                        },
                        {
                            value: 'asian-other',
                            label: localise({
                                en: 'Any other Asian background',
                                cy: ''
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Black / African / Caribbean / Black British',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'caribbean',
                            label: localise({ en: 'Caribbean', cy: '' })
                        },
                        {
                            value: 'african',
                            label: localise({ en: 'African', cy: '' })
                        },
                        {
                            value: 'black-other',
                            label: localise({
                                en: `Any other Black / African / Caribbean background`,
                                cy: ''
                            })
                        }
                    ]
                },
                {
                    label: localise({
                        en: 'Other ethnic group',
                        cy: ''
                    }),
                    options: [
                        {
                            value: 'arab',
                            label: localise({ en: 'Arab', cy: '' })
                        },

                        {
                            value: 'other',
                            label: localise({ en: 'Any other', cy: '' })
                        }
                    ]
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.ETHNIC_BACKGROUND,
                    schema: multiChoice(
                        flatMap(this.optgroups, o => o.options)
                    ).required()
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
        beneficiariesGroupsGender: {
            name: 'beneficiariesGroupsGender',
            label: localise({
                en: `Gender`,
                cy: ''
            }),
            explanation: localise({
                en: `You told us that your project mostly benefits people of a particular gender. Please tell us which one(s).`,
                cy: ``
            }),
            type: 'checkbox',
            options: [
                { value: 'male', label: localise({ en: 'Male', cy: '' }) },
                { value: 'female', label: localise({ en: 'Female', cy: '' }) },
                { value: 'trans', label: localise({ en: 'Trans', cy: '' }) },
                {
                    value: 'non-binary',
                    label: localise({ en: 'Non-binary', cy: '' })
                },
                {
                    value: 'intersex',
                    label: localise({ en: 'Intersex', cy: '' })
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.GENDER,
                    schema: multiChoice(this.options).required()
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
            name: 'beneficiariesGroupsAge',
            label: localise({
                en: `Age`,
                cy: ''
            }),
            explanation: localise({
                en: `You told us that your project mostly benefits people from particular age groups. Please tell us which one(s).`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                { value: '0-12', label: localise({ en: '0–12', cy: '' }) },
                { value: '13-24', label: localise({ en: '13-24', cy: '' }) },
                { value: '25-64', label: localise({ en: '25-64', cy: '' }) },
                { value: '65+', label: localise({ en: '65+', cy: '' }) }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.AGE,
                    schema: multiChoice(this.options).required()
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
        beneficiariesGroupsDisabledPeople: {
            name: 'beneficiariesGroupsDisabledPeople',
            label: localise({ en: `Disabled people`, cy: '' }),
            explanation: localise({
                en: `<p>You told us that your project mostly benefits disabled people. Please tell us which one(s).</p>
                <p>We use the definition from the Equality Act 2010, which defines a disabled person as someone who has a mental or physical impairment that has a substantial and long-term adverse effect on their ability to carry out normal day to day activity.</p>`,
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
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.DISABLED_PEOPLE,
                    schema: multiChoice(this.options).required()
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
        beneficiariesGroupsReligion: {
            name: 'beneficiariesGroupsReligion',
            label: localise({
                en: `Religion or belief`,
                cy: ``
            }),
            explanation: localise({
                en: `You have indicated that your project mostly benefits people of a particular religion or belief, please select from the following`,
                cy: ''
            }),
            type: 'checkbox',
            options: [
                {
                    value: 'buddhist',
                    label: localise({ en: 'Buddhist', cy: '' })
                },
                {
                    value: 'christian',
                    label: localise({ en: 'Christian', cy: '' })
                },
                { value: 'jewish', label: localise({ en: 'Jewish', cy: '' }) },
                { value: 'muslim', label: localise({ en: 'Muslim', cy: '' }) },
                { value: 'sikh', label: localise({ en: 'Sikh', cy: '' }) },
                {
                    value: 'no-religion',
                    label: localise({ en: 'No religion', cy: '' })
                }
            ],
            get schema() {
                return conditionalBeneficiaryChoice({
                    match: BENEFICIARY_GROUPS.RELIGION,
                    schema: multiChoice(this.options).required()
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
        beneficiariesGroupsReligionOther: {
            name: 'beneficiariesGroupsReligionOther',
            label: localise({ en: 'Other', cy: '' }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        organisationLegalName: {
            name: 'organisationLegalName',
            label: localise({
                en: `What is the full legal name of your organisation?`,
                cy: ``
            }),
            explanation: localise({
                en: `<p>This must be as shown on your <strong>governing document</strong>. Your governing document could be called one of several things, depending on the type of organisation you're applying on behalf of. It may be called a constitution, trust deed, memorandum and articles of association, or something else entirely.</p>`,
                cy: ``
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
        organisationTradingName: {
            name: 'organisationTradingName',
            label: localise({
                en: `Does your organisation use a different name in your day-to-day work?`,
                cy: ``
            }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        organisationAddress: addressField({
            name: 'organisationAddress',
            label: localise({
                en: `What is the main or registered address of your organisation?`,
                cy: ``
            })
        }),
        organisationType: organisationTypeField(),
        companyNumber: {
            name: 'companyNumber',
            label: localise({ en: 'Companies house number', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: Joi.when('organisationType', {
                is: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                then: Joi.string().required(),
                otherwise: Joi.any().strip()
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
            name: 'charityNumber',
            label: localise({ en: 'Charity registration number', cy: '' }),
            explanation: localise({
                en: `If you are registered with OSCR, you only need to provide the last five digits of your registration number.`,
                cy: ''
            }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: includes(
                [
                    ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                    ORGANISATION_TYPES.CIO
                ],
                currentOrganisationType
            ),
            schema: Joi.when('organisationType', {
                is: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                then: Joi.number().required()
            }).when('organisationType', {
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
            name: 'educationNumber',
            label: localise({ en: 'Department for Education number', cy: '' }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: true,
            schema: Joi.when('organisationType', {
                is: ORGANISATION_TYPES.SCHOOL,
                then: Joi.string().required()
            }),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter your organisation’s Department for Education number`,
                        cy: ''
                    })
                }
            ]
        },
        accountingYearDate: {
            name: 'accountingYearDate',
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
            name: 'totalIncomeYear',
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
            name: 'mainContactFirstName',
            label: localise({ en: 'First name', cy: '' })
        }),
        mainContactLastName: lastNameField({
            name: 'mainContactLastName',
            label: localise({ en: 'Last name', cy: '' })
        }),
        mainContactDob: dateOfBirthField(MIN_AGE_MAIN_CONTACT, {
            name: 'mainContactDateOfBirth',
            label: localise({ en: 'Date of birth', cy: '' })
        }),
        mainContactAddress: addressField({
            name: 'mainContactAddress',
            label: localise({ en: 'Current address', cy: '' }),
            schema: Joi.ukAddress().when(Joi.ref('organisationType'), {
                is: Joi.valid(
                    ORGANISATION_TYPES.SCHOOL,
                    ORGANISATION_TYPES.STATUTORY_BODY
                ),
                then: Joi.any().optional()
            })
        }),
        mainContactAddressHistory: addressHistoryField({
            name: 'mainContactAddressHistory',
            label: localise({
                en: 'Have they lived at this address for the last three years?',
                cy: ''
            })
        }),
        mainContactEmail: emailField({
            name: 'mainContactEmail',
            label: localise({ en: 'Email', cy: '' }),
            explanation: localise({
                en: 'We’ll use this whenever we get in touch about the project',
                cy: ''
            })
        }),
        mainContactPhone: phoneField({
            name: 'mainContactPhone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        mainContactCommunicationNeeds: communicationNeedsField({
            name: 'mainContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: ``
            })
        }),
        seniorContactFirstName: firstNameField({
            name: 'seniorContactFirstName',
            label: localise({ en: 'First name', cy: '' })
        }),
        seniorContactLastName: lastNameField({
            name: 'seniorContactLastName',
            label: localise({ en: 'Last name', cy: '' })
        }),
        seniorContactRole: seniorContactRoleField(),
        seniorContactDob: dateOfBirthField(MIN_AGE_SENIOR_CONTACT, {
            name: 'seniorContactDateOfBirth',
            label: localise({ en: 'Date of birth', cy: '' })
        }),
        seniorContactAddress: addressField({
            name: 'seniorContactAddress',
            label: localise({ en: 'Current address', cy: '' }),
            schema: Joi.ukAddress().when(Joi.ref('organisationType'), {
                is: Joi.valid(
                    ORGANISATION_TYPES.SCHOOL,
                    ORGANISATION_TYPES.STATUTORY_BODY
                ),
                then: Joi.any().optional()
            })
        }),
        seniorContactAddressHistory: addressHistoryField({
            name: 'seniorContactAddressHistory',
            label: localise({
                en: `Have you lived at your last address for at least three years?`,
                cy: ``
            })
        }),
        seniorContactEmail: emailField({
            name: 'seniorContactEmail',
            label: localise({ en: 'Email', cy: '' }),
            explanation: localise({
                en: 'We’ll use this whenever we get in touch about the project',
                cy: ''
            })
        }),
        seniorContactPhone: phoneField({
            name: 'seniorContactPhone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        seniorContactCommunicationNeeds: communicationNeedsField({
            name: 'seniorContactCommunicationNeeds',
            label: localise({
                en: `Please tell us about any particular communication needs this contact has.`,
                cy: ``
            })
        }),
        bankAccountName: {
            name: 'bankAccountName',
            label: localise({ en: 'Name on the bank account', cy: '' }),
            explanation: localise({
                en: `Name of your organisation as it appears on your bank statement`,
                cy: ``
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
            name: 'bankSortCode',
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
            name: 'bankAccountNumber',
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
        buildingSocietyNumber: {
            name: 'buildingSocietyNumber',
            label: localise({
                en: 'Building society number (if applicable)',
                cy: ''
            }),
            type: 'text',
            explanation: localise({
                en: `This is only applicable if your organisation’s account is with a building society.`,
                cy: ``
            }),
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .empty(),
            messages: []
        },
        bankStatement: {
            name: 'bankStatement',
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

    const schema = Joi.object(
        reduce(
            fields,
            function(acc, field) {
                acc[field.name] = field.schema;
                return acc;
            },
            {}
        )
    );

    const messages = reduce(
        fields,
        function(acc, field) {
            acc[field.name] = field.messages;
            return acc;
        },
        {}
    );

    return {
        fields,
        schema,
        messages
    };
};
