'use strict';
const { get } = require('lodash/fp');
const { includes, reduce } = require('lodash');
const moment = require('moment');

const { Joi, ...commonValidators } = require('../lib/validators');
const enrichForm = require('../lib/enrich-form');
const {
    MIN_AGE_MAIN_CONTACT,
    MIN_AGE_SENIOR_CONTACT,
    MAX_BUDGET_TOTAL_GBP,
    ORGANISATION_TYPES
} = require('./constants');

module.exports = function({ locale, data = {} }) {
    const localise = get(locale);
    const getOrganisationType = get('organisation-type');

    function seniorContactRolesFor(organisationType) {
        let options = [];
        switch (organisationType) {
            case ORGANISATION_TYPES.UNREGISTERED_VCO:
                options = [
                    { value: 'chair', label: localise({ en: 'Chair', cy: '' }) },
                    { value: 'vice-chair', label: localise({ en: 'Vice-chair', cy: '' }) },
                    { value: 'secretary', label: localise({ en: 'Secretary', cy: '' }) },
                    { value: 'treasurer', label: localise({ en: 'Treasurer', cy: '' }) }
                ];
                break;
            case ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY:
            case ORGANISATION_TYPES.CIO:
                options = [{ value: 'trustee', label: localise({ en: 'Trustee', cy: '' }) }];
                break;
            case ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY:
                options = [
                    { value: 'company-director', label: localise({ en: 'Company Director', cy: '' }) },
                    { value: 'company-secretary', label: localise({ en: 'Company Secretary', cy: '' }) }
                ];
                break;
            case ORGANISATION_TYPES.SCHOOL:
                options = [
                    { value: 'head-teacher', label: localise({ en: 'Head Teacher', cy: '' }) },
                    { value: 'chancellor', label: localise({ en: 'Chancellor', cy: '' }) },
                    { value: 'vice-chancellor', label: localise({ en: 'Vice-chancellor', cy: '' }) }
                ];
                break;
            case ORGANISATION_TYPES.STATUTORY_BODY:
                options = [
                    { value: 'parish-clerk', label: localise({ en: 'Parish Clerk', cy: '' }) },
                    { value: 'chief-executive', label: localise({ en: 'Chief Executive', cy: '' }) }
                ];
                break;
            default:
                break;
        }

        return options;
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
                    message: { en: 'Enter an email address', cy: '' }
                },
                {
                    type: 'string.email',
                    message: { en: 'Email address must be in the correct format, like name@example.com', cy: '' }
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
                    message: { en: 'Enter a UK telephone number', cy: '' }
                },
                {
                    type: 'string.phonenumber',
                    message: { en: 'Enter a real UK telephone number', cy: '' }
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
                    message: { en: 'Enter a full UK address', cy: '' }
                },
                {
                    type: 'any.empty',
                    key: 'building-street',
                    message: { en: 'Enter a building and street', cy: '' }
                },
                {
                    type: 'any.empty',
                    key: 'town-city',
                    message: { en: 'Enter a town or city', cy: '' }
                },
                {
                    type: 'any.empty',
                    key: 'county',
                    message: { en: 'Enter a county', cy: '' }
                },
                {
                    type: 'any.empty',
                    key: 'postcode',
                    message: { en: 'Enter a postcode', cy: '' }
                },
                {
                    type: 'string.regex.base',
                    key: 'postcode',
                    message: { en: 'Enter a real postcode', cy: '' }
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
            messages: [{ type: 'base', message: { en: 'Enter first name', cy: '' } }]
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
            messages: [{ type: 'base', message: { en: 'Enter last name', cy: '' } }]
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
                    message: { en: 'Enter a date of birth', cy: '' }
                },
                {
                    type: 'any.invalid',
                    message: { en: 'Enter a real date', cy: '' }
                },
                {
                    type: 'dateParts.dob',
                    message: { en: `Must be at least ${minAge} years old`, cy: '' }
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    function communicationNeedsField(props) {
        const defaultProps = {
            type: 'radio',
            options: [
                { value: 'audiotape', label: localise({ en: 'Audiotape', cy: '' }) },
                { value: 'braille', label: localise({ en: 'Braille', cy: '' }) },
                { value: 'disk', label: localise({ en: 'Disk', cy: '' }) },
                { value: 'large-print', label: localise({ en: 'Large print', cy: '' }) },
                { value: 'letter', label: localise({ en: 'Letter', cy: '' }) },
                { value: 'sign-language', label: localise({ en: 'Sign language', cy: '' }) },
                { value: 'text-relay', label: localise({ en: 'Text relay', cy: '' }) }
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
                    message: { en: 'Choose from one of the options provided', cy: '' }
                }
            ]
        };

        return { ...defaultProps, ...props };
    }

    const allFields = {
        projectName: {
            name: 'project-name',
            label: localise({ en: 'What is the name of your project?', cy: '' }),
            explanation: localise({ en: 'The project name should be simple and to the point', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [{ type: 'base', message: { en: 'Enter a project name', cy: '' } }]
        },
        projectCountry: {
            name: 'project-country',
            label: localise({ en: 'What country will your project be based in?', cy: '' }),
            explanation: localise({
                en: `We work slightly differently depending on which country your project is based in, to meet local needs and the regulations that apply there.`,
                cy: ''
            }),
            type: 'radio',
            options: [
                { value: 'england', label: localise({ en: 'England', cy: '' }) },
                { value: 'northern-ireland', label: localise({ en: 'Northern Ireland', cy: '' }) },
                { value: 'scotland', label: localise({ en: 'Scotland', cy: '' }) },
                { value: 'wales', label: localise({ en: 'Wales', cy: '' }) }
            ],
            isRequired: true,
            get schema() {
                return Joi.string()
                    .valid(this.options.map(option => option.value))
                    .required();
            },
            messages: [{ type: 'base', message: { en: 'Choose a country', cy: '' } }]
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
                        message: { en: 'Enter a date', cy: '' }
                    },
                    {
                        type: 'any.invalid',
                        message: { en: 'Enter a real date', cy: '' }
                    },
                    {
                        type: 'dateParts.futureDate',
                        message: {
                            en: `Date you start the project must be after ${this.settings.fromDateExample}`,
                            cy: ''
                        }
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
            messages: [{ type: 'base', message: { en: 'Enter a real postcode', cy: '' } }]
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
                        message: { en: 'Tell us about your project', cy: '' }
                    },
                    {
                        type: 'string.minWords',
                        message: { en: `Answer must be at least ${this.settings.minWords} words`, cy: '' }
                    },
                    {
                        type: 'string.maxWords',
                        message: { en: `Answer must be no more than ${this.settings.maxWords} words`, cy: '' }
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
                        message: { en: 'Tell us how your project meet at least one of our funding priorities', cy: '' }
                    },
                    {
                        type: 'string.minWords',
                        message: { en: `Answer must be at least ${this.settings.minWords} words`, cy: '' }
                    },
                    {
                        type: 'string.maxWords',
                        message: { en: `Answer must be no more than ${this.settings.maxWords} words`, cy: '' }
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
                        message: { en: 'Tell us how your project involves your community', cy: '' }
                    },
                    {
                        type: 'string.minWords',
                        message: { en: `Answer must be at least ${this.settings.minWords} words`, cy: '' }
                    },
                    {
                        type: 'string.maxWords',
                        message: { en: `Answer must be no more than ${this.settings.maxWords} words`, cy: '' }
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
                en: `
<p>You should use budget headings, rather than a detailed list of items.</p>
<p>For example, if you're applying for pens, pencils, paper and envelopes, using 'office supplies' is fine.</p>
            `,
                cy: 'TODO'
            }),
            type: 'budget',
            attributes: {
                max: MAX_BUDGET_TOTAL_GBP,
                rowLimit: 10
            },
            isRequired: true,
            schema: commonValidators.budgetField(MAX_BUDGET_TOTAL_GBP),
            messages: [
                { type: 'base', message: { en: 'Enter a project budget', cy: '' } },
                { type: 'any.empty', key: 'item', message: { en: 'Enter an item or activity', cy: '' } },
                { type: 'number.base', key: 'cost', message: { en: 'Enter an amount', cy: '' } },
                {
                    type: 'budgetItems.overBudget',
                    message: {
                        en: `Total project costs must be less than £${MAX_BUDGET_TOTAL_GBP.toLocaleString()}`,
                        cy: ``
                    }
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
                    message: { en: 'Enter a total cost for your project', cy: '' }
                },
                {
                    type: 'number.base',
                    message: { en: 'Total cost must be a real number', cy: '' }
                },
                {
                    type: 'budgetTotalCosts.underBudget',
                    message: {
                        en: 'Total cost must be the same as or higher than the amount you’re asking us to fund',
                        cy: ''
                    }
                }
            ]
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
            messages: [{ type: 'base', message: { en: 'Enter the full legal name of the organisation', cy: '' } }]
        },
        organisationAlias: {
            name: 'organisation-alias',
            label: localise({ en: 'Does your organisation use a different name in your day-to-day work?', cy: '' }),
            type: 'text',
            isRequired: false,
            schema: Joi.string()
                .allow('')
                .optional(),
            messages: []
        },
        organisationAddress: addressField({
            name: 'organisation-address',
            label: localise({ en: 'What is the main or registered address of your organisation?', cy: '' })
        }),
        organisationType: {
            name: 'organisation-type',
            label: localise({
                en: 'What type of organisation are you?',
                cy: '(WELSH) What type of organisation are you?'
            }),
            type: 'radio',
            options: [
                {
                    value: ORGANISATION_TYPES.UNREGISTERED_VCO,
                    label: localise({ en: 'Unregistered voluntary or community organisation', cy: '' }),
                    explanation: localise({
                        en: `Groups that are consituted but not registered as a charity or company, for example, Scouts groups, sports clubs, community groups, residents associations`,
                        cy: ``
                    })
                },
                {
                    value: ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                    label: localise({ en: 'Registered charity (unincorporated)', cy: '' }),
                    explanation: localise({
                        en: `Voluntary and community organisations that are registered charities but are not also registered with Companies House as a Company`,
                        cy: ``
                    })
                },
                {
                    value: ORGANISATION_TYPES.CIO,
                    label: localise({ en: 'Charitable incorporated organisation (CIO)', cy: '' })
                },
                {
                    value: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                    label: localise({ en: 'Not-for-profit company', cy: '' }),
                    explanation: localise({
                        en: `Not for profit companies registered with Companies House including those registered as Charities`,
                        cy: ``
                    })
                },
                {
                    value: ORGANISATION_TYPES.SCHOOL,
                    label: localise({ en: 'School or educational body', cy: '' }),
                    explanation: localise({
                        en: `Only select this option if your organisation is a school or regsitered educational establishment`,
                        cy: ``
                    })
                },
                {
                    value: ORGANISATION_TYPES.STATUTORY_BODY,
                    label: localise({ en: 'Statutory body', cy: '' }),
                    explanation: localise({
                        en: 'For example, Health Body, Local Authority, Parish Council, Police',
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
            messages: [{ type: 'base', message: { en: 'Choose a type of organisation', cy: '' } }]
        },
        companyNumber: {
            name: 'company-number',
            label: localise({ en: 'Companies house number', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: Joi.when('organisation-type', {
                is: ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY,
                then: Joi.string().required()
            }),
            messages: [{ type: 'base', message: { en: 'Enter your organisation’s Companies House number', cy: '' } }]
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
                getOrganisationType(data)
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
                    message: { en: 'Enter your organisation’s charity number', cy: '' }
                }
            ]
        },
        accountingYearDate: {
            name: 'accounting-year-date',
            label: localise({ en: 'What is your accounting year end date?', cy: '' }),
            explanation: localise({
                en: `<p><strong>For example: 31 03</strong></p>`,
                cy: ''
            }),
            type: 'day-month',
            isRequired: true,
            schema: Joi.dayMonth().required(),
            messages: [
                { type: 'base', message: { en: 'Enter a day and month', cy: '' } },
                { type: 'any.invalid', message: { en: 'Enter a real day and month', cy: '' } }
            ]
        },
        totalIncomeYear: {
            name: 'total-income-year',
            label: localise({ en: 'What is your total income for the year?', cy: '' }),
            type: 'currency',
            isRequired: true,
            schema: Joi.number().required(),
            messages: [
                { type: 'base', message: { en: 'Enter a total income for the year', cy: '' } },
                { type: 'any.invalid', message: { en: 'Total income must be a real number', cy: '' } }
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
            label: localise({ en: 'Address', cy: '' }),
            schema: commonValidators.ukAddress().when(Joi.ref('organisation-type'), {
                is: Joi.valid(ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY),
                then: Joi.any().optional()
            })
        }),
        mainContactEmail: emailField({
            name: 'main-contact-email',
            label: localise({ en: 'Email', cy: '' }),
            explanation: localise({ en: 'We’ll use this whenever we get in touch about the project', cy: '' })
        }),
        mainContactPhone: phoneField({
            name: 'main-contact-phone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        mainContactCommunicationNeeds: communicationNeedsField({
            name: 'main-contact-communication-needs',
            label: localise({ en: 'Please tell us about any particular communication needs this contact has.', cy: '' })
        }),
        seniorContactFirstName: firstNameField({
            name: 'senior-contact-first-name',
            label: localise({ en: 'First name', cy: '' })
        }),
        seniorContactLastName: lastNameField({
            name: 'senior-contact-last-name',
            label: localise({ en: 'Last name', cy: '' })
        }),
        seniorContactRole: {
            name: 'senior-contact-role',
            label: localise({ en: 'Role', cy: '' }),
            explanation: localise({
                en: `The position held by the senior contact is dependent on the type of organisation you are applying on behalf of. The options given to you for selection are based on this.`,
                cy: ''
            }),
            type: 'radio',
            options: seniorContactRolesFor(getOrganisationType(data)),
            isRequired: true,
            schema: Joi.string().required(),
            messages: [{ type: 'base', message: { en: 'Choose a role', cy: '' } }]
        },
        seniorContactDob: dateOfBirthField(MIN_AGE_SENIOR_CONTACT, {
            name: 'senior-contact-dob',
            label: localise({ en: 'Date of birth', cy: '' })
        }),
        seniorContactAddress: addressField({
            name: 'senior-contact-address',
            label: localise({ en: 'Address', cy: '' }),
            schema: commonValidators.ukAddress().when(Joi.ref('organisation-type'), {
                is: Joi.valid(ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY),
                then: Joi.any().optional()
            })
        }),
        seniorContactEmail: emailField({
            name: 'senior-contact-email',
            label: localise({ en: 'Email', cy: '' }),
            explanation: localise({ en: 'We’ll use this whenever we get in touch about the project', cy: '' })
        }),
        seniorContactPhone: phoneField({
            name: 'senior-contact-phone',
            label: localise({ en: 'Telephone number', cy: '' })
        }),
        seniorContactCommunicationNeeds: communicationNeedsField({
            name: 'senior-contact-communication-needs',
            label: localise({ en: 'Please tell us about any particular communication needs this contact has.', cy: '' })
        }),
        bankAccountName: {
            name: 'bank-account-name',
            label: localise({ en: 'Name on the bank account', cy: '' }),
            explanation: localise({ en: 'Name of your organisation as it appears on your bank statement', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [{ type: 'base', message: { en: 'Enter the name on the bank account', cy: '' } }]
        },
        bankSortCode: {
            name: 'bank-sort-code',
            label: localise({ en: 'Sort code', cy: '' }),
            type: 'text',
            attributes: { size: 20 },
            isRequired: true,
            schema: Joi.string().required(),
            messages: [{ type: 'base', message: { en: 'Enter a sort-code', cy: '' } }]
        },
        bankAccountNumber: {
            name: 'bank-account-number',
            label: localise({ en: 'Account number', cy: '' }),
            type: 'text',
            isRequired: true,
            schema: Joi.string().required(),
            messages: [{ type: 'base', message: { en: 'Enter an account number', cy: '' } }]
        },
        bankBuildingSocietyNumber: {
            name: 'bank-building-society-number',
            label: localise({ en: 'Building society number (if applicable)', cy: '' }),
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
            messages: [{ type: 'base', message: { en: 'Provide a bank statement', cy: '' } }]
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

    const includeAddressAndDob =
        includes([ORGANISATION_TYPES.SCHOOL, ORGANISATION_TYPES.STATUTORY_BODY], getOrganisationType(data)) === false;

    const sectionProject = {
        slug: 'your-project',
        title: localise({ en: 'Your Project', cy: '(WELSH) Your Project' }),
        introduction: localise({
            en: `Please tell us about your project in this section. This is the most important section when it comes to making a decision about whether you will receive funding.`,
            cy: `(WELSH) Please tell us about your project in this section. This is the most important section when it comes to making a decision about whether you will receive funding.`
        }),
        steps: [
            {
                title: localise({ en: 'Project details', cy: '(cy) Project details' }),
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
                        legend: localise({ en: 'Your idea', cy: '(WELSH) Your idea' }),
                        fields: [allFields.yourIdeaProject, allFields.yourIdeaPriorities, allFields.yourIdeaCommunity]
                    }
                ]
            },
            {
                title: localise({ en: 'Project costs', cy: '(WELSH) Project costs' }),
                fieldsets: [
                    {
                        legend: localise({ en: 'Project costs', cy: '(WELSH) Project costs' }),
                        fields: [allFields.projectBudget, allFields.projectTotalCosts]
                    }
                ]
            }
        ]
    };

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
                        legend: localise({ en: 'Organisation details', cy: '' }),
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
                        legend: localise({ en: 'Registration numbers', cy: '' }),
                        get fields() {
                            const includeCompanyNumber =
                                getOrganisationType(data) === ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY;

                            const includeCharityNumber = includes(
                                [
                                    ORGANISATION_TYPES.UNINCORPORATED_REGISTERED_CHARITY,
                                    ORGANISATION_TYPES.CIO,
                                    ORGANISATION_TYPES.NOT_FOR_PROFIT_COMPANY
                                ],
                                getOrganisationType(data)
                            );

                            const fields = [];
                            if (includeCompanyNumber) {
                                fields.push(allFields.companyNumber);
                            }

                            if (includeCharityNumber) {
                                fields.push(allFields.charityNumber);
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
                        legend: localise({ en: 'Organisation finances', cy: '' }),
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
                        legend: localise({ en: 'Who is your main contact?', cy: '' }),
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
                        legend: localise({ en: 'Who is your senior contact?', cy: '' }),
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
                        legend: localise({ en: 'What are your bank account details?', cy: '' }),
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
                title: { en: 'Bank statement', cy: '' },
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

    const formModel = {
        id: 'awards-for-all',
        title: localise({ en: 'National Lottery Awards for All', cy: '' }),
        isBilingual: true,
        sections: [sectionProject, sectionOrganisation, sectionMainContact, sectionSeniorContact, sectionBankDetails],
        termsFields: [
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
                autocompleteName: 'name',
                type: 'text',
                label: localise({ en: 'Full name of person completing this form', cy: '' }),
                isRequired: true
            },
            {
                name: 'terms-person-position',
                autocompleteName: 'position',
                type: 'text',
                label: localise({ en: 'Position in organisation', cy: '' }),
                isRequired: true
            }
        ],
        eligibilityQuestions: [
            {
                question: 'Does your organisation have at least two unconnected people on the board or committee?',
                explanation:
                    'By unconnected, we mean not a relation by blood, marriage, in a long-term relationship or people living together at the same address.',
                ineligibleReason:
                    'This is because you declared that your organisation does not have at least two unconnected people on the board or committee'
            },
            {
                question:
                    'Are you applying for an amount between £300 and £10,000 for a project that will be finished within about 12 months?',
                explanation:
                    "We know it's not always possible to complete a project in 12 months for lots of reasons. We can therefore consider projects which are slightly longer than this. We will also consider applications for one-off events such as a festival, gala day or conference.",
                ineligibleReason:
                    'This is because you declared that your organisation does not need an amount between £300 and £10,000 for a project that will be finished within about 12 months.'
            },
            {
                question: 'Does your project start at least 12 weeks from when you plan to submit your application?',
                explanation:
                    "We need 12 weeks to be able to assess your application and pay your grant, if you're successful. Therefore, projects need to start at least 12 weeks from the date you submit your application to us.",
                ineligibleReason:
                    "This is because you declared that your project doesn't start at least 12 weeks from when we plan to submit your application."
            },
            {
                question:
                    'Do you have a UK bank account in the legal name of your organisation, with at least two unrelated people who are able to manage the account?',
                explanation:
                    "This should be the legal name of your organisation as it appears on your bank statement, not the name of your bank. This will usually be the same as your organisation's name on your governing document.",
                ineligibleReason:
                    "This is because you declared that your organisation doesn't have a UK bank account in the name of your organisation."
            },
            {
                question:
                    "Do you produce annual accounts (or did you set up your organisation less than 15 months ago and haven't produced annual accounts yet)?",
                explanation:
                    "By annual accounts, we mean a summary of your financial activity. If you are a small organisation, this may be produced by your board and doesn't have to be done by an accountant.",
                ineligibleReason:
                    "This is because you declared that your organisation hasn't produced annual accounts, or that your your organisation was set up less than 15 months ago and has not yet produced annual accounts."
            }
        ],
        schema: schema,
        allFields: allFields,
        programmePage: '/funding/programmes/national-lottery-awards-for-all-england'
    };

    // @TODO: Minimise transformations in enrich-form
    return enrichForm(formModel, data);
};
