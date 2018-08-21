'use strict';
const { check } = require('express-validator/check');

const FUND_SIZE = {
    min: 30000,
    max: 100000
};

const LENGTH_HINTS = {
    HEMINGWAY: {
        rows: 3,
        text: 'A single sentence.'
    },
    FEW_LINES: {
        rows: 5,
        text: 'A couple of sentences, no more than a paragraph.'
    },
    FEW_PARAS: {
        rows: 10,
        text: 'A couple of paragraphs.'
    },
    MANY_PARAS: {
        rows: 12,
        text: 'At least three paragraphs.'
    },
    TOLSTOY: {
        rows: 15,
        text: 'At least five paragraphs'
    }
};

// Allows us to share postcode validation on server and client-side
// via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
// we have to double-escape the regex patterns here to output it as a native RegExp
// but also as a string for the HTML pattern attribute
const POSTCODE_PATTERN = '(gir\\s?0aa|[a-zA-Z]{1,2}\\d[\\da-zA-Z]?\\s?(\\d[a-zA-Z]{2})?)';
const POSTCODE_REGEX = new RegExp(POSTCODE_PATTERN, 'i');
const isValidPostcode = input => POSTCODE_REGEX.test(input);

const currentWork = [
    {
        legend: 'Your current work',
        fields: [
            {
                name: 'current-work',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.MANY_PARAS,
                isRequired: true,
                label: 'How is your current work helping to prevent or reduce loneliness?',
                helpText: `<ul>
                    <li>Describe the work you are currently delivering and how it helps to build connections to prevent or reduce loneliness</li>
                    <li>Describe what impact your work has made on tackling loneliness so far,
                        e.g. evidence of the difference it is making, the impact on people and
                        communities and how many people are currently benefiting</li>
                    <li>Tell us how you know your approach is working, about your organisation’s 
                        experience and the skills of your staff.</li>
                </ul>`
            }
        ]
    }
];

const yourIdea = [
    {
        legend: 'Your idea',
        fields: [
            {
                name: 'project-name',
                type: 'text',
                size: 180,
                isRequired: true,
                label: 'What is the name of your project?'
            },
            {
                name: 'project-idea',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                isRequired: true,
                label: 'What is the project you would like funding for, and why is it needed in your area?',
                helpText: `<ul>
                    <li>Describe your project idea and why is it needed in your area</li>
                    <li>Tell us how many people approximately will benefit from this project and who they might be</li>
                    <li>Tell us about how you will reach people in the community and make your project inclusive</li>
                </ul>`
            },
            {
                name: 'project-impact',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                isRequired: true,
                label:
                    'How will you increase your impact by reaching more people and/or joining up in collaboration with others?',
                helpText: `<ul>
                    <li>Describe the additional support you will be able to offer with the funding</li>
                    <li>Describe the groups, organisations, and stakeholders you work with within your area that ensure you are fully connected in tackling loneliness</li>
                    <li>Tell us about how you will ensure that the impact is sustained after this funding finishes</li>
                </ul>`
            }
        ]
    }
];

const projectActivities = [
    {
        legend: 'Project activities',
        introduction: `<p>
            Provide a brief outline of your delivery plan,
            including the main activities and milestones that will demonstrate your achievements
            </p>
            <p>
            If your project ends before March 2021 only
            fill out the fields for the period your project will run until.
            </p>
        `,
        fields: [
            {
                name: 'project-activities-a',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                isRequired: true,
                label: 'What do you hope to achieve for the period until March 2019?'
            },
            {
                name: 'project-activities-b',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                label: 'What do you hope to achieve for the period from April 2019–March 2020?'
            },
            {
                name: 'project-activities-c',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                label: 'What do you hope to achieve for the period April 2020–March 2021?'
            }
        ]
    }
];

const socialConnections = [
    {
        legend: 'Building social connections',
        fields: [
            {
                name: 'social-connections',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                isRequired: true,
                label:
                    'How will the project help to build or increase social connections and relationships between individuals and communities?',
                helpText: `<ul>
                    <li>Describe how the project will increase social connections, sense of community and/or belonging</li>
                    <li>Describe how people and communities are involved in the project</li>
                    <li>Describe your plans for supporting connections in the future after the funding stops</li>
                </ul>`
            }
        ]
    }
];

const projectEvaluation = [
    {
        legend: 'Project evaluation',
        fields: [
            {
                name: 'project-evaluation',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                isRequired: true,
                label:
                    'How will your project help you improve your learning and understand more about the impact you are making?',
                helpText: `<ul>
                    <li>
                        Describe how your project will help add to collective evidence and learning
                        about what works in preventing or reducing loneliness
                    </li>
                    <li>Describe the types of information you are going to collect</li>
                    <li>Describe how your approach will build on previous learning</li>
                </ul>`
            }
        ]
    }
];

const projectLocation = [
    {
        legend: 'Project location',
        fields: [
            {
                name: 'location',
                type: 'checkbox',
                options: [
                    'North East',
                    'North West',
                    'Yorkshire and the Humber',
                    'East Midlands',
                    'West Midlands',
                    'East of England',
                    'Greater London',
                    'South East',
                    'South West'
                ].map(_ => ({ label: _, value: _ })),
                isRequired: true,
                label: 'What regions will your project cover?',
                explanation: 'Select all regions that apply'
            },
            {
                name: 'project-location',
                type: 'text',
                size: 60,
                isRequired: true,
                label: 'Where will your project take place?',
                explanation:
                    'In your own words, describe the locations that you’ll be running your project in. eg. “Newcastle community centre” or “Alfreton, Derby and Ripley”.'
            }
        ]
    }
];

const projectBudget = [
    {
        legend: 'Funding total',
        fields: [
            {
                name: 'project-budget-total',
                type: 'number',
                min: FUND_SIZE.min,
                max: FUND_SIZE.max,
                isCurrency: true,
                size: 20,
                isRequired: true,
                label: 'How much grant funding are you applying for in total?',
                helpText:
                    '<p>The minimum grant size is <strong>£30,000</strong> and the maximum available is <strong>£100,000</strong>.</p>'
            }
        ]
    },
    {
        legend: 'Project budget',
        introduction: `
        <ul>
            <li>
                We need a breakdown of how you plan to use our funding,
                so please tell us about full details of all the costs involved,
                including the salary and hours of key delivery staff,
                and any other funding that will be used for this project,
                where it’s from and if it has been secured.
            </li>
            <li>Projects do not have to be a set length of time but must be
            finished by <strong>March 2021</strong> and start by <strong>January 2019</strong>.</li>
            <li>If your project ends <strong>before March 2021</strong> only
            fill out the fields for the period your project will run until.</li>
        </ul>
        `,
        fields: [
            {
                name: 'project-budget-a-amount',
                type: 'number',
                min: 0,
                max: FUND_SIZE.max,
                isCurrency: true,
                size: 20,
                isRequired: true,
                label: 'How much of the requested amount do you plan to spend for the period until March 2019?'
            },
            {
                name: 'project-budget-a-description',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                isRequired: true,
                label: 'What do you plan to spend the money on for the period until March 2019?',
                helpText: `<p>
                    Please note that we require you to spend a minimum of 20% of your whole budget 
                    in the first three months of the project. We will ask you to evidence this in April 2019.
                </p>`
            },
            {
                name: 'project-budget-b-amount',
                type: 'number',
                min: 0,
                max: FUND_SIZE.max,
                isCurrency: true,
                silentlyOptional: true,
                size: 20,
                label:
                    'How much of the requested amount do you plan to spend for the period until April 2019–March 2020?'
            },
            {
                name: 'project-budget-b-description',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                silentlyOptional: true,
                label: 'What do you plan to spend the money on for the period from April 2019–March 2020?'
            },
            {
                name: 'project-budget-c-amount',
                type: 'number',
                min: 0,
                max: FUND_SIZE.max,
                isCurrency: true,
                silentlyOptional: true,
                size: 20,
                label:
                    'How much of the requested amount do you plan to spend for the period until April 2020–March 2021?'
            },
            {
                name: 'project-budget-c-description',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                silentlyOptional: true,
                label: 'What do you plan to spend the money on for the period April 2020–March 2021?'
            }
        ]
    }
];

const organisationDetails = [
    {
        legend: 'Organisation name',
        fields: [
            {
                type: 'text',
                name: 'organisation-name',
                label: 'Organisation legal name',
                isRequired: true
            }
        ]
    },
    {
        legend: 'Registered organisation address',
        introduction: `If your application is successful we will use this address to send out a conditional offer letter and it will also be used for checks.`,
        fields: [
            {
                type: 'text',
                name: 'address-building-street',
                label: 'Building and street',
                isRequired: true,
                size: 50
            },
            {
                type: 'text',
                name: 'address-town-city',
                label: 'Town or city',
                isRequired: true,
                size: 25
            },
            {
                type: 'text',
                name: 'address-county',
                label: 'County',
                isRequired: true,
                size: 25
            },
            {
                type: 'text',
                name: 'address-postcode',
                label: 'Postcode',
                size: 10,
                isRequired: true,
                customRegex: POSTCODE_PATTERN,
                validator(field) {
                    return check(field.name)
                        .trim()
                        .not()
                        .isEmpty()
                        .withMessage('Postcode must be provided')
                        .custom(value => isValidPostcode(value))
                        .withMessage('Please provide a valid UK postcode');
                }
            }
        ]
    },
    {
        legend: 'Organisation numbers',
        fields: [
            {
                type: 'text',
                name: 'organisation-charity-number',
                label: 'Registered charity number',
                explanation: `
                    If you're unsure, you can
                    <a href="http://beta.charitycommission.gov.uk" target="_blank" rel="noopener">
                        look it up on the Charity Commission website</a>.`
            },
            {
                type: 'text',
                name: 'organisation-company-number',
                label: 'Companies House number',
                explanation: `
                    If you're unsure, you can
                    <a href="https://beta.companieshouse.gov.uk" target="_blank" rel="noopener">
                        look it up on the Companies House website
                    </a>.`
            }
        ]
    }
];

const mainContact = [
    {
        legend: 'Main contact',
        introduction: '<p>Who should we contact if we have questions about your application?</p>',
        fields: [
            {
                type: 'text',
                name: 'first-name',
                autocompleteName: 'given-name',
                label: 'First name',
                isRequired: true
            },
            {
                type: 'text',
                name: 'last-name',
                autocompleteName: 'family-name',
                label: 'Last name',
                isRequired: true
            },
            {
                type: 'email',
                name: 'email',
                autocompleteName: 'email',
                label: 'Email address',
                isRequired: true,
                explanation: `<p>We will email a copy of your submission to the email address provided here.</p>`,
                validator: function(field) {
                    return check(field.name)
                        .trim()
                        .isEmail()
                        .withMessage('Please provide a valid email address');
                }
            },
            {
                type: 'text',
                name: 'phone-number',
                isRequired: true,
                autocompleteName: 'tel',
                label: 'Phone number'
            }
        ]
    }
];

module.exports = {
    currentWork,
    mainContact,
    organisationDetails,
    projectActivities,
    projectBudget,
    projectEvaluation,
    projectLocation,
    socialConnections,
    yourIdea,
    isValidPostcode
};
