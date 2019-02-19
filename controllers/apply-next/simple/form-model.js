'use strict';
const path = require('path');

const { check } = require('express-validator/check');

const sectionProject = {
    slug: 'your-project',
    title: 'Your Project',
    steps: [
        {
            title: 'Get started',
            fieldsets: [
                {
                    legend: 'Get started',
                    fields: [
                        {
                            type: 'text',
                            name: 'project-name',
                            label: 'What is the name of your project?',
                            explanation: 'The project name should be simple and to the point',
                            isRequired: true
                        },
                        {
                            name: 'project-country',
                            label: 'Please select the country your project will be based in.',
                            explanation:
                                'We work slightly differently depending on which country your project is based in, to meet local needs and the regulations that apply there.',
                            type: 'radio',
                            options: [
                                { value: 'england', label: 'England' },
                                { value: 'northern-ireland', label: 'Northern Ireland' },
                                { value: 'scotland', label: 'Scotland' },
                                { value: 'wales', label: 'Wales' }
                            ],
                            isRequired: true
                        }
                    ]
                }
            ]
        },
        {
            title: 'Project details',
            fieldsets: [
                {
                    legend: 'Get started',
                    fields: [
                        {
                            type: 'date',
                            name: 'project-start-date',
                            label: 'When is the planned (or estimated) start date of your project?',
                            explanation:
                                'This date needs to be at least 12 weeks from when you plan to submit your application. If your project is a one-off event, please tell us the date of the event.',
                            isRequired: true,
                            validator: function(field) {
                                // Now + 12 weeks at a minimum?
                                return check(field.name)
                                    .isAfter()
                                    .withMessage('Date must be in the future');
                            }
                        },
                        {
                            type: 'text',
                            name: 'project-postcode',
                            label: 'What is the postcode of the location where your project will take place?',
                            explanation:
                                'If your project will take place across different locations, please use the postcode where most of the project will take place.',
                            isRequired: true,
                            validator: function(field) {
                                return check(field.name)
                                    .isPostalCode('GB')
                                    .withMessage('Must be a valid postcode');
                            }
                        }
                    ]
                }
            ]
        }
    ]
};

const sectionBeneficiaries = {
    slug: 'beneficiaries',
    title: 'Who will benefit from your project',
    summary: `
        <h2>Who will benefit from your project</h2>
        <p>We want to hear more about the people who will benefit from your project.</p>

        <p>It's important to be as accurate as possible in your answers. We'll use this information to make better decisions about how our funding supports people and communities. We'll also use it to tell people about the impact of our funding and who it is reaching.</p>

        <p>However, the information you provide here is not assessed and will not be used to decide whether you will be awarded funding for your project.</p>
    `,
    steps: [
        {
            title: 'Number of people',
            fieldsets: [
                {
                    legend: 'Number of people',
                    fields: [
                        {
                            type: 'text',
                            name: 'beneficiary-numbers',
                            label: 'How many people will benefit from your project?',
                            explanation: 'Please enter the exact figure, or the closest estimate.',
                            isRequired: true
                        }
                    ]
                }
            ]
        }
    ]
};

module.exports = {
    id: 'awards-for-all',
    title: 'National Lottery Awards for All',
    isBilingual: false,
    sections: [sectionProject, sectionBeneficiaries],
    // processor: processor,
    startPage: { template: path.resolve(__dirname, './startpage') },
    successStep: { template: path.resolve(__dirname, './success') }
};
