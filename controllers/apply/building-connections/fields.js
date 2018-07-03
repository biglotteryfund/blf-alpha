'use strict';
const { check } = require('express-validator/check');

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

const currentWork = [
    {
        legend: 'Your current work',
        fields: [
            {
                name: 'current-work',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.MANY_PARAS,
                isRequired: true,
                label: 'How is your current work committed to helping to prevent or reduce lonelines?',
                helpText: `<ul>
                    <li>Describe the work you are currently delivering and how it helps prevent or reduce loneliness</li>
                    <li>Describe what impact your work has made on tackling loneliness so far,
                        e.g. evidence of the difference it is making, the impact on people and
                        communities and how many people are currently benefiting</li>
                    <li>Tell us about the effectiveness of your approach and your
                        organisation’s experience and expertise in of working with loneliness.</li>
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
                name: 'project-idea',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                isRequired: true,
                label: 'What is the project you would like funding for, and why is it needed in your area?'
            },
            {
                name: 'project-impact',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                isRequired: true,
                label: 'How will you scale up work you are already doing and/or join up in collaboration with others?',
                helpText: `<p>Please describe the additional support you will be able to offer</p>`
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
            If your project runs for less than the full two years only
            fill out the fields for the period your project will run until.
            </p>
        `,
        fields: [
            {
                name: 'project-activities-a',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_LINES,
                isRequired: true,
                label: 'What do you hope to achieve for the period until March 2019?'
            },
            {
                name: 'project-activities-b',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_LINES,
                label: 'What do you hope to achieve for the period from April 2019–March 2020?'
            },
            {
                name: 'project-activities-c',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_LINES,
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
                    'How will the project help to build social connections and relationships between individuals and communities?',
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
                    <li>Describe the types of evidence you are going to collect</li>
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

const projectTheme = [
    {
        legend: 'Project theme',
        introduction: `<p>This question is purely indicative and will not impact on your chances of success.</p>`,
        fields: [
            {
                isRequired: true,
                name: 'primary-theme',
                type: 'radio',
                options: [
                    'Rural',
                    'Digital',
                    'Employment',
                    'Sport',
                    'Volunteering',
                    'Education',
                    'Arts and culture',
                    'Community assets',
                    'Environment'
                ].map(_ => ({ label: _, value: _ })),
                label: 'What is the primary theme for your project?',
                explanation: 'Please select one of the following as your primary theme'
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
                type: 'text',
                isRequired: true,
                label: 'How much grant funding are you applying for in total?'
            }
        ]
    },
    {
        legend: 'Project budget',
        introduction: `<p>
            If your project runs for less than the full two years only fill
            out the fields for the period your project will run until.
        </p>`,
        fields: [
            {
                name: 'project-budget-a',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                isRequired: true,
                label: 'What do you plan to spend the money on for the period until March 2019?',
                helpText: `<p>
                    We need a breakdown of how you plan to use our funding,
                    so please tell us about full details of all the costs involved,
                    including the salary and hours of key delivery staff.
                </p>`
            },
            {
                name: 'project-budget-b',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
                label: 'What do you plan to spend the money on for the period from April 2019–March 2020?'
            },
            {
                name: 'project-budget-c',
                type: 'textarea',
                lengthHint: LENGTH_HINTS.FEW_PARAS,
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
        introduction: `If your application is succesful we will use this address to send out a conditional offer letter.`,
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
                validator(field) {
                    return check(field.name)
                        .trim()
                        .not()
                        .isEmpty()
                        .withMessage('Postcode must be provided')
                        .isPostalCode('GB')
                        .withMessage('Invalid postcode');
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
                explanation: `If you're unsure, you can <a href="http://beta.charitycommission.gov.uk" target="_blank">look it up here</a>.`
            },
            {
                type: 'text',
                name: 'organisation-company-number',
                label: 'Companies House number',
                explanation: `If you're unsure, you can <a href="https://beta.companieshouse.gov.uk" target="_blank">look it up here</a>.`
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
    projectTheme,
    socialConnections,
    yourIdea
};
