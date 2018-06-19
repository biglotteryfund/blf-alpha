'use strict';
const { check } = require('express-validator/check');

const currentWork = [
    {
        legend: 'Your current work',
        fields: [
            {
                name: 'current-work',
                type: 'textarea',
                rows: 14,
                isRequired: true,
                label: 'How is your current work committed to helping to prevent or reduce loneliness?',
                helpText: `<ul>
                    <li>What impact has your work made to date on tackling loneliness</li>
                    <li>Why you are working on loneliness</li>
                    <li>If applying for <strong>over £50,000</strong> Include areas of strengths and weaknesses.</li>
                </ul>`
            }
        ]
    }
];

const yourIdea = [
    {
        legend: 'Your project idea',
        fields: [
            {
                type: 'text',
                name: 'project-name',
                label: 'What is the name of your project?',
                isRequired: true
            },
            {
                name: 'project-idea',
                type: 'textarea',
                rows: 15,
                isRequired: true,
                label: 'What is the project you would like funding for?',
                helpText: `<ul>
                    <li>Describe the project you would like funding for</li>
                    <li>Tell us why it is needed in your area</li>
                    <li>Describe who will deliver the project and the experience they have</li>
                </ul>`
            }
        ]
    }
];

const projectActivities = [
    {
        legend: 'Project activities, outcomes, and milestones',
        fields: [
            {
                name: 'project-activities-outline',
                type: 'textarea',
                rows: 6,
                isRequired: true,
                label: 'Briefly outline what your project is aiming to achieve'
            },
            {
                name: 'project-activities-first-quarter',
                type: 'textarea',
                rows: 6,
                isRequired: true,
                label: 'What will be achieved in the first quarter Jan—March 2019?'
            },
            {
                name: 'project-activities-first-year',
                type: 'textarea',
                rows: 6,
                isRequired: true,
                label: 'What will be achieved in the financial year 2019/20?',
                explanation:
                    'If your project finishes before the end of the 2020 financial year include up until the end of your project.'
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

const increasingImpact = [
    {
        legend: 'Increasing impact',
        fields: [
            {
                name: 'increasing-impact',
                type: 'textarea',
                rows: 12,
                isRequired: true,
                label: 'How will this funding support your project to increase your impact?',
                helpText: `<p>Describe how your project will meet our aims and objectives by either:</p>
                <ul>
                    <li>scaling up work you are already doing</li>
                    <li><strong>or</strong> joining up with others in partnership</li>
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
                rows: 12,
                isRequired: true,
                label:
                    'How will your project help you to improve your learning and help understand more about the impact you are making?',
                helpText: `<ul>
                    <li>Describe why you want to add to the evidence and learning</li>
                    <li>Describe how you plan to investigate that your project has helped make an impact on reducing or preventing loneliness</li>
                </ul>`
            },
            {
                name: 'project-evaluation-future',
                type: 'textarea',
                rows: 6,
                label: 'How will you monitor and report impact and learning?',
                explanation: 'Only answer if applying for <strong>over £50,000</strong>'
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
                label: 'How much grant funding are you applying for in total?',
                explanation: '<p>We are offering between £30,000–£100,000 of grant funding.</p>'
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
                rows: 6,
                isRequired: true,
                label: 'What do you plan to spend the money on for the period until March 2019?'
            },
            {
                name: 'project-budget-b',
                type: 'textarea',
                rows: 6,
                label: 'What do you plan to spend the money on for the period until March 2020?'
            },
            {
                name: 'project-budget-c',
                type: 'textarea',
                rows: 6,
                label: 'What do you plan to spend the money on for the period until March 2021?'
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
        legend: 'Organisation numbers',
        fields: [
            {
                type: 'text',
                name: 'organisation-charity-number',
                label: 'Registered charity number'
            },
            {
                type: 'text',
                name: 'organisation-company-number',
                label: 'Companies House number'
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
    increasingImpact,
    mainContact,
    organisationDetails,
    projectActivities,
    projectBudget,
    projectEvaluation,
    projectLocation,
    yourIdea
};
