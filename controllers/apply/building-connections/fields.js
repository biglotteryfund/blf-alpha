'use strict';
const { check } = require('express-validator/check');

// @TODO: Are these the same as Reaching Communities? Can we share then
const PROJECT_LOCATIONS = [
    {
        label: 'North East & Cumbria',
        value: 'North East & Cumbria',
        explanation: 'covering Newcastle, Cumbria and the north-east of England'
    },
    {
        label: 'North West',
        value: 'North West',
        explanation: 'covering Greater Manchester, Lancashire, Cheshire and Merseyside'
    },
    {
        label: 'Yorkshire and the Humber',
        value: 'Yorkshire and the Humber',
        explanation: 'covering Yorkshire, north and north-east Lincolnshire'
    },
    {
        label: 'South West',
        value: 'South West',
        explanation: 'covering Exeter, Bristol and the south-west of England'
    },
    {
        label: 'London, South East and East of England',
        value: 'London and South East'
    },
    {
        label: 'East and West Midlands',
        value: 'Midlands'
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
                explanation: `<ul>
                    <li>Describe the project you would like funding for, how you think it can help to reduce or prevent loneliness, and why it is needed in your area</li>
                    <li>If applying for <strong>over £50,000</strong> please also tell us who will deliver the project and the experience they have</li>
                </ul>`
            }
        ]
    }
];

const projectLocation = [
    {
        legend: 'Where will your project take place?',
        fields: [
            {
                name: 'location',
                type: 'checkbox',
                options: PROJECT_LOCATIONS,
                isRequired: true,
                label: 'Project region',
                explanation: 'Select all regions that apply'
            },
            {
                name: 'project-location',
                type: 'text',
                size: 60,
                isRequired: true,
                label: 'Project location',
                explanation:
                    'In your own words, describe the locations that you’ll be running your project in. eg. “Newcastle community centre” or “Alfreton, Derby and Ripley”.'
            }
        ]
    }
];

const currentWork = [
    {
        legend: 'Current work',
        fields: [
            {
                name: 'current-work',
                type: 'textarea',
                rows: 14,
                isRequired: true,
                label: 'How is your current work committed to helping to prevent or reduce loneliness?',
                explanation: `<ul>
                    <li>What impact has your work made to date. If you've not worked in this area before describe how you plan to do so.</li>
                    <li>If applying for <strong>over £50,000</strong> tell us about some of the challenges you've faced delivering your work.</li>
                </ul>`
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
                explanation: `<p>How will your project meet our Fund aims and objectives of:</p>
                <ul>
                    <li>scaling up work you are already doing</li>
                    <li>changing some of your activities to have a focus on reducing or preventing loneliness</li>
                    <li>by joining up with others in partnership</li>
                <ul>`
            },
            {
                name: 'increasing-impact-partners',
                type: 'textarea',
                rows: 3,
                label: 'Are you working with any other partner organisations?',
                explanation: `<p>
                    If you’re working with other organisations to deliver your idea, list them below. If you don’t know yet we can discuss this later on.
                </p>`
            }
        ]
    }
];

const projectActivities = [
    {
        legend: 'Project activities',
        fields: [
            {
                name: 'project-activities',
                type: 'textarea',
                rows: 12,
                isRequired: true,
                label: "What are your project's key activities, outcomes, and milestones?",
                explanation: `<ul>
                    <li>Please break these up by each quarter e.g., Jan–Mar, Apr–Jun, Jul–Sept, Oct–Dec (bullet points are fine)</li>
                    <li>How will you make sure that you will keep to milestones?</li>
                </ul>`
            }
        ]
    }
];

const projectBudget = [
    {
        legend: 'Project budget',
        fields: [
            {
                name: 'project-budget-total',
                type: 'text',
                isRequired: true,
                label: 'How much grant funding are you applying for in total?',
                explanation: '<p>We are offering between £30,000–£100,000 of grant funding until December 2020.</p>'
            },
            {
                name: 'project-budget-breakdown',
                type: 'textarea',
                rows: 12,
                isRequired: true,
                label: 'What you would like to spend the money on and when you will need it?',
                explanation: `<p>Please provide grant request costs (per year). Projects can be shorter than 2 years.</p><ul>
                    <li>Between Oct 2018–March 2019</li>
                    <li>Between April 19–March 2020</li>
                    <li>Between April 2020–December 2020</li>
                </ul>`
            },
            {
                name: 'project-budget-future',
                type: 'textarea',
                rows: 6,
                label: 'How do you aim to make the impact of the project last beyond the period of funding?',
                explanation: 'Only answer if applying for <strong>over £50,000</strong>'
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
                explanation: `<p>Please tell us:</p><ul>
                    <li>why you want to add to the evidence and learning</li>
                    <li>how you plan to investigate that your project has helped make an impact on reducing or preventing loneliness?</li>
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
        introduction: `<p>
            What is your registered charity number and/or Companies House number?
        </p>`,
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
    yourIdea,
    projectLocation,
    currentWork,
    increasingImpact,
    projectActivities,
    projectBudget,
    projectEvaluation,
    organisationDetails,
    mainContact
};
