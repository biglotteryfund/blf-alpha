'use strict';
const { get, includes, reduce, values } = require('lodash');
const moment = require('moment');

const { Joi, ...commonValidators } = require('../lib/validators');

const MIN_AGE_MAIN_CONTACT = 16;
const MIN_AGE_SENIOR_CONTACT = 18;
const MAX_BUDGET_TOTAL = 10000; // in GBP

const countries = {
    england: { value: 'england', label: { en: 'England', cy: '' } },
    northernIreland: { value: 'northern-ireland', label: { en: 'Northern Ireland', cy: '' } },
    scotland: { value: 'scotland', label: { en: 'Scotland', cy: '' } },
    wales: { value: 'wales', label: { en: 'Wales', cy: '' } }
};

const organisationTypes = {
    unregisteredVco: {
        value: 'unregistered-vco',
        label: { en: 'Unregistered voluntary or community organisation', cy: '' },
        explanation: {
            en: `Groups that are consituted but not registered as a charity or company, for example, Scouts groups, sports clubs, community groups, residents associations`,
            cy: ``
        }
    },
    unincorporatedRegisteredCharity: {
        value: 'unincorporated-registered-charity',
        label: { en: 'Registered charity (unincorporated)', cy: '' },
        explanation: {
            en: `Voluntary and community organisations that are registered charities but are not also registered with Companies House as a Company`,
            cy: ``
        }
    },
    charitableIncorporatedOrganisation: {
        value: 'charitable-incorporated-organisation',
        label: { en: 'Charitable incorporated organisation (CIO)', cy: '' }
    },
    notForProfitCompany: {
        value: 'not-for-profit-company',
        label: { en: 'Not-for-profit company', cy: '' },
        explanation: {
            en: `Not for profit companies registered with Companies House including those registered as Charities`,
            cy: ``
        }
    },
    school: {
        value: 'school',
        label: { en: 'School or educational body', cy: '' },
        explanation: {
            en: `Only select this option if your organisation is a school or regsitered educational establishment`,
            cy: ``
        }
    },
    statutoryBody: {
        value: 'statutory-body',
        label: { en: 'Statutory body', cy: '' },
        explanation: { en: 'For example, Health Body, Local Authority, Parish Council, Police', cy: '' }
    }
};

function emailField(props) {
    const defaultProps = {
        label: { en: 'Email', cy: '' },
        type: 'email',
        attributes: {
            autocomplete: 'email'
        },
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
                message: { en: 'Enter an email address in the correct format, like name@example.com', cy: '' }
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
                message: { en: 'Enter a phone number', cy: '' }
            },
            {
                type: 'string.phonenumber',
                message: { en: 'Enter a valid UK phone number', cy: '' }
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
                type: 'string.regex.base',
                key: 'postcode',
                message: { en: 'Enter a valid postcode', cy: '' }
            }
        ]
    };

    return { ...defaultProps, ...props };
}

function dateOfBirthField(minAge, props) {
    const defaultProps = {
        type: 'date',
        attributes: {
            max: moment()
                .subtract(minAge, 'years')
                .format('YYYY-MM-DD')
        },
        isRequired: true,
        schema: Joi.when(Joi.ref('organisation-type'), {
            is: organisationTypes.school.value,
            then: Joi.any().optional(),
            otherwise: commonValidators.dateOfBirth(minAge).required()
        }),
        shouldShow(formData = {}) {
            return (
                includes(
                    [organisationTypes.school.value, organisationTypes.statutoryBody.value],
                    get(formData, 'organisation-type')
                ) === false
            );
        },
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

const allFields = {
    applicationTitle: {
        name: 'application-title',
        label: { en: 'What is the name of your project?', cy: '' },
        explanation: { en: 'The project name should be simple and to the point', cy: '' },
        type: 'text',
        isRequired: true,
        schema: Joi.string().required(),
        messages: [{ type: 'base', message: { en: 'Enter a project name', cy: '' } }]
    },
    applicationCountry: {
        name: 'application-country',
        label: { en: 'What country will your project be based in?', cy: '' },
        explanation: {
            en:
                'We work slightly differently depending on which country your project is based in, to meet local needs and the regulations that apply there.',
            cy: ''
        },
        type: 'radio',
        options: values(countries),
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
        label: {
            en: 'When is the planned (or estimated) start date of your project?',
            cy: '(WELSH) When is the planned (or estimated) start date of your project?'
        },
        get settings() {
            const dt = moment().add(12, 'weeks');
            return {
                minDateExample: dt.format('DD MM YYYY'),
                minYear: dt.format('YYYY')
            };
        },
        get explanation() {
            return {
                en: `<p>This date needs to be at least 12 weeks from when you plan to submit your application. If your project is a one-off event, please tell us the date of the event.</p>
                <p><strong>For example: ${this.settings.minDateExample}</strong></p>`,
                cy: ''
            };
        },
        type: 'date',
        isRequired: true,
        schema: commonValidators.futureDate({ amount: '12', unit: 'weeks' }),
        messages: [
            { type: 'base', message: { en: 'Enter a date', cy: '' } },
            { type: 'any.invalid', message: { en: 'Enter a real date', cy: '' } },
            { type: 'dateParts.futureDate', message: { en: 'Date must be at least 12 weeks into the future', cy: '' } }
        ]
    },
    projectPostcode: {
        name: 'project-postcode',
        label: {
            en: 'What is the postcode of the location where your project will take place?',
            cy: '(WELSH) What is the postcode of the location where your project will take place?'
        },
        explanation: {
            en:
                'If your project will take place across different locations, please use the postcode where most of the project will take place.',
            cy:
                '(WELSH) If your project will take place across different locations, please use the postcode where most of the project will take place.'
        },
        type: 'text',
        attributes: {
            size: 10,
            autocomplete: 'postal-code'
        },
        isRequired: true,
        schema: commonValidators.postcode().required(),
        messages: [{ type: 'base', message: { en: 'Enter a postcode', cy: '' } }]
    },
    yourIdea: {
        name: 'your-idea',
        label: {
            en: 'What would you like to do?',
            cy: 'WELSH What would you like to do?'
        },
        explanation: {
            en: `
<p>When answering this question there are two key areas that we will use to make a decision on your project:</p>

<p><strong>1. National Lottery Awards for all has three funding priorities and you must meet at least one of these. Please tell us how your project will:</strong></p>

<ul>
    <li>bring people together and build strong relationships in and across communities</li>
    <li>improve the places and spaces that matter to communities</li>         
    <li>enable more people to fulfil their potential by working to address issues at the earliest possible stage</li>     
</ul>
            
<p><strong>2. It's important to us that you involve your community in the design, development and delivery of the activities you're planning, so please tell us how you've done this.</strong></p>

<p>Here are some ideas about what else to tell us:</p>

<ul>            
    <li>How your project idea came about. Is it something new, or are you continuing something that has worked well previously?</li>
    <li>If you are running a one-off event, what date it will take place</li>
    <li>How long you expect your project to run</li>
    <li>How you will make sure people know about your project and will attend</li>
    <li>How you'll learn from your project and use this to shape future projects</li>
</ul>
            `,
            cy: 'TODO'
        },
        type: 'textarea',
        settings: {
            showWordCount: true,
            minWords: 50,
            maxWords: 500
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
                    message: { en: 'Tell us about your idea', cy: '' }
                },
                {
                    type: 'string.minWords',
                    message: { en: `Must be at least ${this.settings.minWords} words`, cy: '' }
                },
                {
                    type: 'string.maxWords',
                    message: { en: `Must be no more than ${this.settings.maxWords} words`, cy: '' }
                }
            ];
        }
    },
    projectBudget: {
        name: 'project-budget',
        label: {
            en: 'List the costs you would like us to fund',
            cy: ''
        },
        explanation: {
            en: `
<p>You should use budget headings, rather than a detailed list of items.</p>
<p>For example, if you're applying for pens, pencils, paper and envelopes, using 'office supplies' is fine.</p>
            `,
            cy: 'TODO'
        },
        type: 'budget',
        attributes: {
            max: MAX_BUDGET_TOTAL,
            rowLimit: 10
        },
        isRequired: true,
        schema: commonValidators.budgetField(MAX_BUDGET_TOTAL),
        messages: [
            { type: 'base', message: { en: 'Enter a project budget', cy: '' } },
            { type: 'any.empty', message: { en: 'Please supply both an item name and a cost', cy: '' } },
            { type: 'number.base', message: { en: 'Make sure each cost is a valid number', cy: '' } },
            {
                type: 'budgetItems.overBudget',
                message: {
                    en: `You have exceeded the budget limit for this application of £${MAX_BUDGET_TOTAL.toLocaleString()}`,
                    cy: ``
                }
            }
        ]
    },
    projectTotalCosts: {
        name: 'project-total-costs',
        label: {
            en: 'Tell us the total cost of your project.',
            cy: '(WELSH) Tell us the total cost of your project.'
        },
        explanation: {
            en: `
            <p>This is the cost of everything related to your project, even things you aren't asking us to fund.</p>

            <p>For example, if you are asking us for £8,000 and you are getting £10,000 from another funder to cover additional costs, then your total project cost is £18,000. If you are asking us for £8,000 and there are no other costs then your total project cost is £8,000.</p>
            `,
            cy: 'TODO'
        },
        type: 'currency',
        isRequired: true,
        schema: Joi.number().required(),
        messages: [
            {
                type: 'base',
                message: { en: 'Enter a total cost for your project, must be a number', cy: '' }
            }
        ]
    },
    organisationLegalName: {
        name: 'organisation-legal-name',
        label: {
            en: 'What is the full legal name of your organisation?',
            cy: '(WELSH) What is the full legal name of your organisation, as shown on your governing document?'
        },
        explanation: {
            en: `
            <p>This must be as shown on your <strong>governing document</strong>. Your governing document could be called one of several things, depending on the type of organisation you're applying on behalf of. It may be called a constitution, trust deed, memorandum and articles of association, or something else entirely.</p>
            `,
            cy: ''
        },
        type: 'text',
        isRequired: true,
        schema: Joi.string().required(),
        messages: [{ type: 'base', message: { en: 'Enter the legal name of the organisation', cy: '' } }]
    },
    organisationAlias: {
        name: 'organisation-alias',
        label: { en: 'Does your organisation use a different name in your day-to-day work?', cy: '' },
        type: 'text',
        isRequired: false,
        schema: Joi.string()
            .allow('')
            .optional(),
        messages: []
    },
    organisationAddress: addressField({
        name: 'organisation-address',
        label: { en: 'What is the main or registered address of your organisation?', cy: '' }
    }),
    organisationType: {
        name: 'organisation-type',
        label: { en: 'What type of organisation are you?', cy: '(WELSH) What type of organisation are you?' },
        type: 'radio',
        options: values(organisationTypes),
        isRequired: true,
        get schema() {
            return Joi.string()
                .valid(this.options.map(option => option.value))
                .required();
        },
        messages: [{ type: 'base', message: { en: 'Choose an organisation type', cy: '' } }]
    },
    companyNumber: {
        name: 'company-number',
        label: { en: 'Companies house number', cy: '' },
        type: 'text',
        isRequired: true,
        shouldShow(formData = {}) {
            return get(formData, 'organisation-type') === organisationTypes.notForProfitCompany.value;
        },
        schema: Joi.when('organisation-type', {
            is: organisationTypes.notForProfitCompany.value,
            then: Joi.string().required()
        }),
        messages: [{ type: 'base', message: { en: 'Enter a companies house number', cy: '' } }]
    },
    charityNumber: {
        name: 'charity-number',
        label: { en: 'Charity registration number', cy: '' },
        explanation: {
            en: `If you are registered with OSCR, you only need to provide the last five digits of your registration number.`,
            cy: ''
        },
        type: 'text',
        attributes: { size: 20 },
        // @TODO: Can we compute this based on the schema?
        isRequired(formData = {}) {
            return includes(
                [
                    organisationTypes.unincorporatedRegisteredCharity.value,
                    organisationTypes.charitableIncorporatedOrganisation.value
                ],
                get(formData, 'organisation-type')
            );
        },
        shouldShow(formData = {}) {
            return includes(
                [
                    organisationTypes.unincorporatedRegisteredCharity.value,
                    organisationTypes.charitableIncorporatedOrganisation.value,
                    organisationTypes.notForProfitCompany.value
                ],
                get(formData, 'organisation-type')
            );
        },
        schema: Joi.when('organisation-type', {
            is: organisationTypes.unincorporatedRegisteredCharity.value,
            then: Joi.number().required()
        }).when('organisation-type', {
            is: organisationTypes.charitableIncorporatedOrganisation.value,
            then: Joi.number().required()
        }),
        messages: [
            {
                type: 'base',
                message: { en: 'Enter a charity number', cy: '' }
            }
        ]
    },
    accountingYearDate: {
        name: 'accounting-year-date',
        label: { en: 'What is your accounting year end date?', cy: '' },
        explanation: {
            en: `<p><strong>For example: 31 03</strong></p>`,
            cy: ''
        },
        type: 'day-month',
        isRequired: true,
        schema: Joi.dayMonth().required(),
        messages: [{ type: 'base', message: { en: 'Enter valid day and month', cy: '' } }]
    },
    totalIncomeYear: {
        name: 'total-income-year',
        label: { en: 'What is your total income for the year?', cy: '' },
        type: 'currency',
        isRequired: true,
        schema: Joi.number().required(),
        messages: [{ type: 'base', message: { en: 'Enter a number for total income for the year', cy: '' } }]
    },
    mainContactName: {
        name: 'main-contact-name',
        label: { en: 'Full name', cy: '' },
        type: 'text',
        attributes: {
            autocomplete: 'name',
            spellcheck: 'false'
        },
        isRequired: true,
        schema: Joi.string().required(),
        messages: [{ type: 'base', message: { en: 'Enter full name', cy: '' } }]
    },
    mainContactDob: dateOfBirthField(MIN_AGE_MAIN_CONTACT, {
        name: 'main-contact-dob',
        label: { en: 'Date of birth', cy: '' }
    }),
    mainContactAddress: addressField({
        name: 'main-contact-address',
        label: { en: 'Address', cy: '' },
        schema: Joi.when(Joi.ref('organisation-type'), {
            is: organisationTypes.school.value,
            then: Joi.any().optional(),
            otherwise: commonValidators.ukAddress().required()
        }),
        shouldShow(formData = {}) {
            return (
                includes(
                    [organisationTypes.school.value, organisationTypes.statutoryBody.value],
                    get(formData, 'organisation-type')
                ) === false
            );
        }
    }),
    mainContactEmail: emailField({
        name: 'main-contact-email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' }
    }),
    mainContactPhone: phoneField({
        name: 'main-contact-phone',
        label: { en: 'UK telephone number', cy: '' }
    }),
    mainContactCommunicationNeeds: {
        name: 'main-contact-communication-needs',
        label: { en: 'Does this contact have any communication needs?', cy: '' },
        type: 'checkbox',
        options: [
            { value: 'audiotape', label: { en: 'Audiotape', cy: '' } },
            { value: 'braille', label: { en: 'Braille', cy: '' } },
            { value: 'large-print', label: { en: 'Large print', cy: '' } }
        ],
        isRequired: false,
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
    },
    legalContactName: {
        name: 'legal-contact-name',
        label: { en: 'Full name', cy: '' },
        explanation: {
            en: `This person will be legally responsible for the funding and must be unconnected to the main contact. By ‘unconnected’ we mean not related by blood, marriage, in a long-term relationship or people living together at the same address.`,
            cy: ''
        },
        type: 'text',
        attributes: {
            autocomplete: 'name',
            spellcheck: 'false'
        },
        isRequired: true,
        schema: Joi.string().required(),
        messages: [{ type: 'base', message: { en: 'Enter full name', cy: '' } }]
    },
    legalContactRole: {
        name: 'legal-contact-role',
        label: { en: 'Role', cy: '' },
        explanation: {
            en: `The position held by the legally responsible contact is dependent on the type of organisation you are applying on behalf of. The options given to you for selection are based on this.`,
            cy: ''
        },
        type: 'radio',
        options(formData) {
            let options = [];
            switch (get(formData, 'organisation-type')) {
                case organisationTypes.unregisteredVco.value:
                    options = [
                        { value: 'chair', label: { en: 'Chair', cy: '' } },
                        { value: 'vice-chair', label: { en: 'Vice-chair', cy: '' } },
                        { value: 'secretary', label: { en: 'Secretary', cy: '' } },
                        { value: 'treasurer', label: { en: 'Treasurer', cy: '' } }
                    ];
                    break;
                case organisationTypes.unincorporatedRegisteredCharity.value:
                case organisationTypes.charitableIncorporatedOrganisation.value:
                    options = [{ value: 'trustee', label: { en: 'Trustee', cy: '' } }];
                    break;
                case organisationTypes.notForProfitCompany.value:
                    options = [
                        { value: 'company-director', label: { en: 'Company Director', cy: '' } },
                        { value: 'company-secretary', label: { en: 'Company Secretary', cy: '' } }
                    ];
                    break;
                case organisationTypes.school.value:
                    options = [
                        { value: 'head-teacher', label: { en: 'Head Teacher', cy: '' } },
                        { value: 'chancellor', label: { en: 'Chancellor', cy: '' } },
                        { value: 'vice-chancellor', label: { en: 'Vice-chancellor', cy: '' } }
                    ];
                    break;
                case organisationTypes.statutoryBody.value:
                    options = [
                        { value: 'parish-clerk', label: { en: 'Parish Clerk', cy: '' } },
                        { value: 'chief-executive', label: { en: 'Chief Executive', cy: '' } }
                    ];
                    break;
                default:
                    break;
            }

            return options;
        },
        isRequired: true,
        schema: Joi.string().required(),
        messages: [{ type: 'base', message: { en: 'Choose a role', cy: '' } }]
    },
    legalContactDob: dateOfBirthField(MIN_AGE_SENIOR_CONTACT, {
        name: 'legal-contact-dob',
        label: { en: 'Date of birth', cy: '' },
        explanation: {
            en: `They must be at least ${MIN_AGE_SENIOR_CONTACT} years old and are responsible for ensuring that this application is supported by the organisation applying, any funding is delivered as set out in the application form, and that the funded organisation meets our monitoring requirements.`,
            cy: ''
        }
    }),
    legalContactAddress: addressField({
        name: 'legal-contact-address',
        label: { en: 'Address', cy: '' },
        schema: Joi.when(Joi.ref('organisation-type'), {
            is: organisationTypes.school.value,
            then: Joi.any().optional(),
            otherwise: commonValidators.ukAddress().required()
        }),
        shouldShow(formData = {}) {
            return (
                includes(
                    [organisationTypes.school.value, organisationTypes.statutoryBody.value],
                    get(formData, 'organisation-type')
                ) === false
            );
        }
    }),
    legalContactEmail: emailField({
        name: 'legal-contact-email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' }
    }),
    legalContactPhone: phoneField({
        name: 'legal-contact-phone',
        label: { en: 'UK telephone number', cy: '' }
    }),
    legalContactCommunicationNeeds: {
        name: 'legal-contact-communication-needs',
        type: 'checkbox',
        label: { en: 'Does this contact have any communication needs?', cy: '' },
        options: [
            { value: 'audiotape', label: { en: 'Audiotape', cy: '' } },
            { value: 'braille', label: { en: 'Braille', cy: '' } },
            { value: 'large-print', label: { en: 'Large print', cy: '' } }
        ],
        isRequired: false,
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
    },
    bankAccountName: {
        name: 'bank-account-name',
        label: { en: 'Name on the bank account', cy: '' },
        explanation: { en: 'Name of your organisation as it appears on your bank statement', cy: '' },
        type: 'text',
        isRequired: true,
        schema: Joi.string().required(),
        messages: [{ type: 'base', message: { en: 'Enter the name on the account', cy: '' } }]
    },
    bankSortCode: {
        name: 'bank-sort-code',
        label: { en: 'Sort code', cy: '' },
        type: 'text',
        attributes: {
            size: 20
        },
        isRequired: true,
        schema: Joi.string().required(),
        messages: [{ type: 'base', message: { en: 'Enter a sort-code', cy: '' } }]
    },
    bankAccountNumber: {
        name: 'bank-account-number',
        label: { en: 'Account number', cy: '' },
        type: 'text',
        isRequired: true,
        schema: Joi.number().required(),
        messages: [{ type: 'base', message: { en: 'Enter an account number', cy: '' } }]
    },
    bankBuildingSocietyNumber: {
        name: 'bank-building-society-number',
        label: { en: 'Building society number (if applicable)', cy: '' },
        type: 'text',
        explanation: {
            en: 'This is only applicable if your organisation’s account is with a building society.',
            cy: ''
        },
        isRequired: false,
        schema: Joi.string()
            .allow('')
            .empty(),
        messages: []
    },
    bankStatement: {
        name: 'bank-statement',
        label: { en: 'Upload a bank statement', cy: '' },
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

module.exports = {
    schema,
    allFields,
    countries,
    organisationTypes
};
