'use strict';
const { forEach, get, has, isArray, reduce, sumBy, values } = require('lodash');
const moment = require('moment');

const { Joi, POSTCODE_PATTERN, ...commonValidators } = require('../lib/validators');

const MIN_APPLICANT_AGE = 18;
const MAX_BUDGET_TOTAL = 10000; // in GBP

const countries = {
    england: { value: 'england', label: { en: 'England', cy: '' } },
    northernIreland: { value: 'northern-ireland', label: { en: 'Northern Ireland', cy: '' } },
    scotland: { value: 'scotland', label: { en: 'Scotland', cy: '' } },
    wales: { value: 'wales', label: { en: 'Wales', cy: '' } }
};

const organisationTypes = {
    constitutedVoluntaryCommunity: {
        value: 'constituted-voluntary-community',
        label: { en: 'Constituted voluntary or community organisation', cy: '' },
        explanation: { en: 'i.e. not registered as a company or charity', cy: '' }
    },
    unincorporatedRegisteredCharity: {
        value: 'unincorporated-registered-charity',
        label: { en: 'Unincorporated registered charity', cy: '' },
        explanation: { en: 'You will need to provide your charities commission registration number', cy: '' }
    },
    charitableIncorporatedOrganisation: {
        value: 'charitable-incorporated-organisation',
        label: { en: 'Charitable incorporated organisation (CIO)', cy: '' },
        explanation: { en: 'You will need to provide your companies house registration number', cy: '' }
    },
    notForProfitCompany: {
        value: 'not-for-profit-company',
        label: { en: 'Not-for-profit company', cy: '' },
        explanation: { en: 'You will need to provide your companies house registration number', cy: '' }
    },
    communityInterestCompany: {
        value: 'community-interest-company',
        label: { en: 'Community interest company (CIC)', cy: '' },
        explanation: { en: 'You will need to provide your companies house registration number', cy: '' }
    },
    school: {
        value: 'school',
        label: { en: 'School', cy: '' }
    },
    statutoryBody: {
        value: 'statutory-body',
        label: { en: 'Statutory body', cy: '' }
    }
};

const legalContactRoles = [
    {
        value: 'director',
        label: { en: 'Director', cy: '' },
        showWhen: formData => {
            return has(formData, 'company-number');
        }
    },
    {
        value: 'company-secretary',
        label: { en: 'Company Secretary', cy: '' },
        showWhen: formData => {
            return has(formData, 'company-number');
        }
    },
    {
        value: 'clerk',
        label: { en: 'Parish, Town or Community Council Clerk', cy: '' },
        showWhen: formData => {
            return get(formData, 'organisation-type') === organisationTypes.statutoryBody.value;
        }
    },
    {
        value: 'head-teacher',
        label: { en: 'Head Teacher', cy: '' },
        showWhen: formData => {
            return get(formData, 'organisation-type') === organisationTypes.school.value;
        }
    },
    { value: 'chair', label: { en: 'Chair', cy: '' } },
    { value: 'vice-chair', label: { en: 'Vice-chair', cy: '' } },
    { value: 'treasurer', label: { en: 'Treasurer', cy: '' } },
    { value: 'trustee', label: { en: 'Trustee', cy: '' } }
];

function postcodeField(props) {
    const defaultProps = {
        label: { en: 'Postcode', cy: '' },
        type: 'text',
        attributes: {
            size: 10,
            autocomplete: 'postal-code',
            pattern: POSTCODE_PATTERN
        },
        isRequired: true,
        schema: commonValidators.postcode().required(),
        messages: {
            base: { en: 'Enter a postcode', cy: '' }
        }
    };

    return { ...defaultProps, ...props };
}

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
        messages: {
            base: { en: 'Enter an email address', cy: '' },
            'string.email': { en: 'Enter an email address in the correct format, like name@example.com', cy: '' }
        }
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
        messages: {
            base: { en: 'Enter a project name', cy: '' }
        }
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
        messages: {
            base: { en: 'Choose a country', cy: '' }
        }
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
        messages: {
            base: { en: 'Enter a date', cy: '' },
            'any.invalid': { en: 'Enter a real date', cy: '' },
            'dateParts.futureDate': { en: 'Date must be at least 12 weeks into the future', cy: '' }
        }
    },
    projectPostcode: postcodeField({
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
        }
    }),
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
            maxWords: 500
        },
        attributes: {
            rows: 12
        },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Tell us about your idea', cy: '' }
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
        messages: {
            base: { en: 'Enter a project budget', cy: '' },
            'any.empty': { en: 'Please supply both an item name and a cost', cy: '' },
            'number.base': { en: 'Make sure each cost is a valid number', cy: '' },
            'budgetItems.overBudget': {
                en: `Ensure your budget total is £${MAX_BUDGET_TOTAL.toLocaleString()} or less.`,
                cy: `(WELSH) Ensure your budget total is £${MAX_BUDGET_TOTAL.toLocaleString()} or less.`
            }
        },
        displayFormat(value) {
            if (!isArray(value)) {
                return value;
            } else {
                const total = sumBy(value, item => parseInt(item.cost || 0));
                return [
                    value.map(line => `${line.item} – £${line.cost.toLocaleString()}`).join('\n'),
                    `Total: £${total}`
                ].join('\n');
            }
        }
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
        messages: {
            base: { en: 'Enter a total cost for your project, must be a number', cy: '' }
        }
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
        messages: {
            base: { en: 'Enter the legal name of the organisation', cy: '' }
        }
    },
    organisationAlias: {
        name: 'organisation-alias',
        label: { en: 'Does your organisation use a different name in your day-to-day work?', cy: '' },
        type: 'text',
        isRequired: false,
        schema: Joi.string()
            .allow('')
            .optional()
    },
    organisationAddressBuildingStreet: {
        name: `main-contact-address-building-street`,
        label: { en: 'Building and street', cy: '' },
        type: 'text',
        attributes: { size: 50 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a building and street', cy: '' }
        }
    },
    organisationAddressTownCity: {
        name: `organisation-address-town-city`,
        label: { en: 'Town or city', cy: '' },
        type: 'text',
        attributes: { size: 25 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a town or city', cy: '' }
        }
    },
    organisationAddressCounty: {
        name: `organisation-address-county`,
        label: { en: 'County', cy: '' },
        type: 'text',
        attributes: { size: 25 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a county', cy: '' }
        }
    },
    organisationAddressPostcode: postcodeField({
        name: `organisation-address-postcode`,
        label: { en: 'Postcode', cy: '' }
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
        messages: {
            base: { en: 'Choose an organisation type', cy: '' }
        }
    },
    charityNumber: {
        name: 'charity-number',
        label: { en: 'Charity registration number', cy: '' },
        explanation: {
            en:
                'If you are registered with OSCR, you only need to provide the last five digits of your registration number.',
            cy: ''
        },
        type: 'text',
        attributes: {
            size: 20
        },
        isRequired: true,
        schema: Joi.any().when('organisation-type', {
            is: Joi.valid(organisationTypes.unincorporatedRegisteredCharity.value),
            then: Joi.number().required()
        }),
        messages: {
            base: { en: 'Enter a charity number', cy: '' }
        }
    },
    companyNumber: {
        name: 'company-number',
        label: { en: 'Companies house number', cy: '' },
        type: 'text',
        isRequired: true,
        schema: Joi.any().when('organisation-type', {
            is: Joi.valid([
                organisationTypes.charitableIncorporatedOrganisation.value,
                organisationTypes.notForProfitCompany.value,
                organisationTypes.communityInterestCompany.value
            ]),
            then: Joi.string().required()
        }),
        messages: {
            base: { en: 'Enter a companies house number', cy: '' }
        }
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
        messages: {
            base: { en: 'Enter valid day and month', cy: '' }
        }
    },
    totalIncomeYear: {
        name: 'total-income-year',
        label: { en: 'What is your total income for the year?', cy: '' },
        type: 'currency',
        isRequired: true,
        schema: Joi.number().required(),
        messages: {
            base: { en: 'Enter a number for total income for the year', cy: '' }
        },
        displayFormat(value) {
            return `£${value}`;
        }
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
        messages: {
            base: { en: 'Enter full name', cy: '' }
        }
    },
    mainContactDob: {
        name: 'main-contact-dob',
        label: { en: 'Date of birth', cy: '' },
        type: 'date',
        attributes: {
            max: moment()
                .subtract(MIN_APPLICANT_AGE, 'years')
                .format('YYYY-MM-DD')
        },
        isRequired: true,
        schema: commonValidators.dateOfBirth(MIN_APPLICANT_AGE),
        messages: {
            base: { en: 'Enter a date of birth', cy: '' },
            'dateParts.dob': { en: `Main contact must be at least ${MIN_APPLICANT_AGE} years old`, cy: '' }
        }
    },
    mainContactAddressBuildingStreet: {
        name: `main-contact-address-building-street`,
        label: { en: 'Building and street', cy: '' },
        type: 'text',
        attributes: { size: 50 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a building and street', cy: '' }
        }
    },
    mainContactAddressTownCity: {
        name: `main-contact-address-town-city`,
        label: { en: 'Town or city', cy: '' },
        type: 'text',
        attributes: { size: 25 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a town or city', cy: '' }
        }
    },
    mainContactAddressCounty: {
        name: `main-contact-address-county`,
        label: { en: 'County', cy: '' },
        type: 'text',
        attributes: { size: 25 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a county', cy: '' }
        }
    },
    mainContactAddressPostcode: postcodeField({
        name: `main-contact-address-postcode`,
        label: { en: 'Postcode', cy: '' }
    }),
    mainContactEmail: emailField({
        name: 'main-contact-email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' }
    }),
    mainContactPhone: {
        name: 'main-contact-phone',
        label: { en: 'UK telephone number', cy: '' },
        type: 'tel',
        attributes: {
            size: 30,
            autocomplete: 'tel'
        },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a phone number', cy: '' }
        }
    },
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
        messages: {
            'any.allowOnly': { en: 'Choose from one of the options provided', cy: '' }
        }
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
        messages: {
            base: { en: 'Enter full name', cy: '' }
        }
    },
    legalContactRole: {
        name: 'legal-contact-role',
        label: { en: 'Role', cy: '' },
        explanation: {
            en: `The position held by the legally responsible contact is dependent on the type of organisation you are applying on behalf of. The options given to you for selection are based on this.`,
            cy: ''
        },
        type: 'radio',
        options: legalContactRoles,
        isRequired: true,
        get schema() {
            return Joi.array()
                .items(Joi.string().valid(this.options.map(option => option.value)))
                .single()
                .optional();
        },
        messages: {
            base: { en: 'Choose from one of the options provided', cy: '' }
        }
    },
    legalContactDob: {
        name: 'legal-contact-dob',
        label: { en: 'Date of birth', cy: '' },
        explanation: {
            en: `They must be at least ${MIN_APPLICANT_AGE} years old and are responsible for ensuring that this application is supported by the organisation applying, any funding is delivered as set out in the application form, and that the funded organisation meets our monitoring requirements.`,
            cy: ''
        },
        type: 'date',
        attributes: {
            max: moment()
                .subtract(MIN_APPLICANT_AGE, 'years')
                .format('YYYY-MM-DD')
        },
        isRequired: true,
        schema: commonValidators.dateOfBirth(MIN_APPLICANT_AGE),
        messages: {
            base: { en: 'Enter a date of birth', cy: '' },
            'dateParts.dob': { en: `Legal contact must be at least ${MIN_APPLICANT_AGE} years old`, cy: '' }
        }
    },
    legalContactAddressBuildingStreet: {
        name: `legal-contact-address-building-street`,
        label: { en: 'Building and street', cy: '' },
        type: 'text',
        attributes: { size: 50 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a building and street', cy: '' }
        }
    },
    legalContactAddressTownCity: {
        name: `legal-contact-address-town-city`,
        label: { en: 'Town or city', cy: '' },
        type: 'text',
        attributes: { size: 25 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a town or city', cy: '' }
        }
    },
    legalContactAddressCounty: {
        name: `legal-contact-address-county`,
        label: { en: 'County', cy: '' },
        type: 'text',
        attributes: { size: 25 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter a county', cy: '' }
        }
    },
    legalContactAddressPostcode: postcodeField({
        name: 'legal-contact-address-postcode',
        label: { en: 'Postcode', cy: '' }
    }),
    legalContactEmail: emailField({
        name: 'legal-contact-email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' }
    }),
    legalContactPhone: {
        name: 'legal-contact-phone',
        autocompleteName: 'tel',
        type: 'tel',
        size: 30,
        label: { en: 'Contact number', cy: '' },
        isRequired: true,
        schema: Joi.number().required(),
        messages: {
            base: { en: 'Enter a phone number', cy: '' }
        }
    },
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
        messages: {
            'any.allowOnly': { en: 'Choose from one of the options provided', cy: '' }
        }
    },
    bankAccountName: {
        name: 'bank-account-name',
        label: { en: 'Name on the bank account', cy: '' },
        explanation: { en: 'Name of your organisation as it appears on your bank statement', cy: '' },
        type: 'text',
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Enter the name on the account', cy: '' }
        }
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
        messages: {
            base: { en: 'Enter a sort-code', cy: '' }
        }
    },
    bankAccountNumber: {
        name: 'bank-account-number',
        label: { en: 'Account number', cy: '' },
        type: 'text',
        isRequired: true,
        schema: Joi.number().required(),
        messages: {
            base: { en: 'Enter an account number', cy: '' }
        }
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
            .empty()
    },
    bankStatement: {
        name: 'bank-statement',
        label: { en: 'Upload a bank statement', cy: '' },
        type: 'file',
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Provide a bank statement', cy: '' }
        }
    }
};

/**
 * Validate fields against a schema
 */
forEach(allFields, field => {
    const localeString = Joi.object({
        en: Joi.string().required(),
        // @TODO: Remove allow '' when translating
        cy: Joi.string()
            .allow('')
            .required()
    });

    const fieldSchema = Joi.object({
        name: Joi.string().required(),
        label: localeString.required(),
        explanation: localeString.optional(),
        type: Joi.string()
            .valid([
                'text',
                'textarea',
                'number',
                'radio',
                'checkbox',
                'file',
                'email',
                'tel',
                'date',
                'day-month',
                'currency',
                'budget'
            ])
            .required(),
        attributes: Joi.object().optional(),
        isRequired: Joi.boolean().required(),
        schema: Joi.object()
            .schema()
            .required(),
        messages: Joi.any().when('isRequired', {
            is: Joi.valid(true),
            then: Joi.object({ base: localeString.required() })
                .pattern(Joi.string(), localeString.required())
                .required()
        }),
        displayFormat: Joi.func()
            .arity(1)
            .optional()
    });

    const validationResult = Joi.validate(field, fieldSchema, {
        abortEarly: true,
        allowUnknown: true
    });

    if (validationResult.error) {
        throw new Error(`${field.name}: ${validationResult.error.message}`);
    }
});

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
    legalContactRoles,
    organisationTypes
};
