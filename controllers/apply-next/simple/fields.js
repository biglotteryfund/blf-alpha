'use strict';
const { forEach, reduce, values } = require('lodash');
const Joi = require('joi');
const moment = require('moment');

const commonValidators = require('../validators');

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

const MIN_APPLICANT_AGE = 16;

function postcodeField(props) {
    // Allows us to use postcode validation on the client-side
    // via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
    // we have to double-escape the regex patterns here
    // to output it as a string for the HTML pattern attribute
    const POSTCODE_PATTERN = '(gir\\s?0aa|[a-zA-Z]{1,2}\\d[\\da-zA-Z]?\\s?(\\d[a-zA-Z]{2})?)';

    const defaultProps = {
        label: { en: 'Postcode', cy: '' },
        type: 'text',
        attributes: {
            size: 10,
            autocomplete: 'postal-code',
            pattern: POSTCODE_PATTERN
        },
        isRequired: true,
        schema: commonValidators.postcode.required(),
        messages: {
            base: { en: 'Please provide a postcode', cy: '' },
            'string.regex.base': { en: 'Please provide a valid postcode', cy: '' }
        }
    };

    return { ...defaultProps, ...props };
}

const allFields = {
    projectStartDate: {
        name: 'project-start-date',
        label: {
            en: 'When is the planned (or estimated) start date of your project?',
            cy: '(WELSH) When is the planned (or estimated) start date of your project?'
        },
        explanation: {
            en:
                'This date needs to be at least 12 weeks from when you plan to submit your application. If your project is a one-off event, please tell us the date of the event.',
            cy:
                '(WELSH) This date needs to be at least 12 weeks from when you plan to submit your application. If your project is a one-off event, please tell us the date of the event.'
        },
        type: 'date',
        attributes: {
            min: moment()
                .add(12, 'weeks')
                .format('YYYY-MM-DD')
        },
        isRequired: true,
        schema: commonValidators.futureDate('12', 'weeks'),
        messages: {
            base: { en: 'Please provide a project start date', cy: '' },
            'date.min': { en: 'Project start date must be at least 12 weeks into the future', cy: '' }
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
        attributes: {
            rows: 12
        },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Please tell us about your idea', cy: '' }
        }
    },
    projectBudget: {
        name: 'project-budget',
        label: {
            en: 'Please tell us the costs you would like us to fund',
            cy: '(WELSH) Please tell us the costs you would like us to fund'
        },
        explanation: {
            en: `
<p>You should use budget headings, rather than a detailed list of items.</p>
<p>For example, if you're applying for pens, pencils, paper and envelopes, using 'office supplies' is fine.</p>
            `,
            cy: 'TODO'
        },
        type: 'textarea',
        attributes: {
            rows: 12
        },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Please provide a project budget', cy: '' }
        }
    },
    projectTotalCosts: {
        name: 'project-total-costs',
        label: {
            en: 'Please tell us the total cost of your project.',
            cy: '(WELSH) Please tell us the total cost of your project.'
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
            base: { en: 'Please provide the total costs for your project', cy: '' },
            'number.base': { en: 'Please enter a number', cy: '' }
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
            cy: 'TODO'
        },
        type: 'text',
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Please provide the name of your organisation', cy: '' }
        }
    },
    organisationAlias: {
        name: 'organisation-alias',
        label: { en: 'Does your organisation use a different name in your day-to-day work?', cy: '' },
        type: 'text',
        isRequired: false,
        schema: Joi.any()
            .disallow(Joi.ref('organisation-legal-name'))
            .optional(),
        messages: {
            base: { en: 'Organisation alias should’t be the same as the legal name', cy: '' }
        }
    },
    organisationAddressBuildingStreet: {
        name: `main-contact-address-building-street`,
        label: { en: 'Building and street', cy: '' },
        type: 'text',
        attributes: { size: 50 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Please provide a building and street' }
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
            base: { en: 'Please provide a town or city' }
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
            base: { en: 'Please provide a county' }
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
        get schema() {
            return Joi.string()
                .valid(this.options.map(option => option.value))
                .required();
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
        type: 'number',
        isRequired: true,
        schema: Joi.any().when('organsation-type', {
            is: Joi.valid(organisationTypes.unincorporatedRegisteredCharity.value),
            then: Joi.number().required()
        })
    },
    companyNumber: {
        name: 'company-number',
        label: { en: 'Companies house number', cy: '' },
        type: 'number',
        isRequired: true,
        schema: Joi.any().when('organsation-type', {
            is: Joi.valid([
                organisationTypes.charitableIncorporatedOrganisation.value,
                organisationTypes.notForProfitCompany.value,
                organisationTypes.communityInterestCompany.value
            ]),
            then: Joi.number().required()
        })
    },
    accountingYearDate: {
        name: 'accounting-year-date',
        label: { en: 'What is your accounting year end date?', cy: '' },
        type: 'date',
        isRequired: true,
        schema: Joi.date().max('now')
    },
    totalIncomeYear: {
        name: 'total-income-year',
        label: { en: 'What is your total income for the year?', cy: '' },
        type: 'currency',
        isRequired: true,
        schema: Joi.number().required()
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
        schema: Joi.string().required()
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
        schema: commonValidators.dateOfBirth(MIN_APPLICANT_AGE)
    },
    mainContactAddressBuildingStreet: {
        name: `main-contact-address-building-street`,
        label: { en: 'Building and street', cy: '' },
        type: 'text',
        attributes: { size: 50 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Please provide a building and street' }
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
            base: { en: 'Please provide a town or city' }
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
            base: { en: 'Please provide a county' }
        }
    },
    mainContactAddressPostcode: postcodeField({
        name: `main-contact-address-postcode`,
        label: { en: 'Postcode', cy: '' }
    }),
    mainContactEmail: {
        name: 'main-contact-email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' },
        type: 'email',
        isRequired: true,
        schema: Joi.string()
            .email()
            .required()
    },
    mainContactPhone: {
        name: 'main-contact-phone',
        type: 'tel',
        attributes: {
            size: 30,
            autocomplete: 'tel'
        },
        label: { en: 'UK telephone number', cy: '' },
        isRequired: true,
        schema: Joi.string().required()
    },
    mainContactCommunicationNeeds: {
        name: 'main-contact-communication-needs',
        label: { en: 'Does this contact have any communication needs?', cy: '' },
        type: 'radio',
        options: [
            { value: 'audiotape', label: { en: 'Audiotape', cy: '' } },
            { value: 'braille', label: { en: 'Braille', cy: '' } },
            { value: 'large-print', label: { en: 'Large print', cy: '' } }
        ],
        get schema() {
            return Joi.any().valid(this.options.map(option => option.value));
        }
    },
    legalContactName: {
        name: 'legal-contact-name',
        label: { en: 'Full name', cy: '' },
        type: 'text',
        attributes: {
            autocomplete: 'name',
            spellcheck: 'false'
        },
        isRequired: true,
        schema: Joi.string().required()
    },
    legalContactDob: {
        name: 'legal-contact-dob',
        label: { en: 'Date of birth', cy: '' },
        type: 'date',
        attributes: {
            max: moment()
                .subtract(MIN_APPLICANT_AGE, 'years')
                .format('YYYY-MM-DD')
        },
        isRequired: true,
        schema: commonValidators.dateOfBirth(MIN_APPLICANT_AGE)
    },
    legalContactAddressBuildingStreet: {
        name: `legal-contact-address-building-street`,
        label: { en: 'Building and street', cy: '' },
        type: 'text',
        attributes: { size: 50 },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Please provide a building and street' }
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
            base: { en: 'Please provide a town or city' }
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
            base: { en: 'Please provide a county' }
        }
    },
    legalContactAddressPostcode: postcodeField({
        name: 'legal-contact-address-postcode',
        label: { en: 'Postcode', cy: '' }
    }),
    legalContactEmail: {
        name: 'legal-contact-email',
        label: { en: 'Email', cy: '' },
        explanation: { en: 'We’ll use this whenever we get in touch about the project', cy: '' },
        type: 'email',
        isRequired: true,
        schema: Joi.string()
            .email()
            .required()
    },
    legalContactPhone: {
        name: 'legal-contact-phone',
        autocompleteName: 'tel',
        type: 'tel',
        size: 30,
        label: { en: 'Contact number', cy: '' },
        isRequired: true,
        schema: Joi.number().required()
    },
    legalContactCommunicationNeeds: {
        name: 'legal-contact-communication-needs',
        type: 'radio',
        label: { en: 'Does this contact have any communication needs?', cy: '' },
        options: [
            { value: 'audiotape', label: { en: 'Audiotape', cy: '' } },
            { value: 'braille', label: { en: 'Braille', cy: '' } },
            { value: 'large-print', label: { en: 'Large print', cy: '' } }
        ],
        get schema() {
            return Joi.any().valid(this.options.map(option => option.value));
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
            base: { en: 'Please provide the name on the accunt', cy: '' }
        }
    },
    bankSortCode: {
        name: 'bank-sort-code',
        label: { en: 'Sort code', cy: '' },
        type: 'string',
        attributes: {
            size: 20
        },
        isRequired: true,
        schema: Joi.string().required(),
        messages: {
            base: { en: 'Please provide a sort-code', cy: '' }
        }
    },
    bankAccountNumber: {
        name: 'bank-account-number',
        label: { en: 'Account number', cy: '' },
        type: 'string',
        isRequired: true,
        schema: Joi.number().required(),
        messages: {
            base: { en: 'Please provide an account number', cy: '' }
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
        schema: Joi.number()
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
            base: { en: 'Please provide an bank statement', cy: '' }
        }
    }
};

/**
 * Validate fields against a schema
 */
forEach(allFields, field => {
    const localeString = Joi.object({
        en: Joi.string().required(),
        cy: Joi.any() // @TODO: Make required
    });

    const fieldSchema = Joi.object({
        name: Joi.string().required(),
        label: localeString.required(),
        explanation: localeString.optional(),
        type: Joi.string().required(),
        attributes: Joi.object().optional(),
        isRequired: Joi.boolean().optional(),
        schema: Joi.object()
            .schema()
            .required(),
        messages: Joi.object({ base: localeString.required() })
            .pattern(Joi.string(), localeString.required())
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
    organisationTypes
};
