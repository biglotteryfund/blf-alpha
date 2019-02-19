'use strict';
const path = require('path');

const { check } = require('express-validator/check');

const sectionProject = {
    slug: 'your-project',
    title: {
        en: 'Your Project',
        cy: '(WELSH) Your Project'
    },
    steps: [
        {
            title: {
                en: 'Get started',
                cy: '(WELSH) Get started'
            },
            fieldsets: [
                {
                    legend: {
                        en: 'Get started',
                        cy: '(WELSH) Get started'
                    },
                    fields: [
                        {
                            type: 'text',
                            name: 'project-name',
                            isRequired: true,
                            label: {
                                en: 'What is the name of your project?',
                                cy: '(WELSH) What is the name of your project?'
                            },
                            explanation: {
                                en: 'The project name should be simple and to the point',
                                cy: '(WELSH) The project name should be simple and to the point'
                            }
                        },
                        {
                            name: 'project-country',
                            label: {
                                en: 'Please select the country your project will be based in.',
                                cy: '(WELSH) Please select the country your project will be based in.'
                            },
                            explanation: {
                                en:
                                    'We work slightly differently depending on which country your project is based in, to meet local needs and the regulations that apply there.',
                                cy:
                                    '(WELSH) We work slightly differently depending on which country your project is based in, to meet local needs and the regulations that apply there.'
                            },
                            type: 'radio',
                            options: [
                                {
                                    value: 'england',
                                    label: {
                                        en: 'England',
                                        cy: '(WELSH) England'
                                    }
                                },
                                {
                                    value: 'northern-ireland',
                                    label: {
                                        en: 'Northern Ireland',
                                        cy: '(WELSH) Northern Ireland'
                                    }
                                },
                                {
                                    value: 'scotland',
                                    label: {
                                        en: 'Scotland',
                                        cy: '(WELSH) Scotland'
                                    }
                                },
                                {
                                    value: 'wales',
                                    label: {
                                        en: 'Wales',
                                        cy: '(WELSH) Wales'
                                    }
                                }
                            ],
                            isRequired: true
                        }
                    ]
                }
            ]
        },
        {
            title: {
                en: 'Project details',
                cy: '(WELSH) Project details'
            },
            fieldsets: [
                {
                    legend: {
                        en: 'Get started',
                        cy: '(WELSH) Get started'
                    },
                    fields: [
                        {
                            type: 'date',
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
                            isRequired: true,
                            validator: function(field) {
                                // Now + 12 weeks at a minimum?
                                return check(field.name)
                                    .isAfter()
                                    .withMessage((value, { req }) => {
                                        return {
                                            en: 'Date must be in the future',
                                            cy: 'WELSH ERROR'
                                        }[req.i18n.getLocale()];
                                    });
                            }
                        },
                        {
                            type: 'text',
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
                            isRequired: true,
                            validator: function(field) {
                                return check(field.name)
                                    .isPostalCode('GB')
                                    .withMessage((value, { req }) => {
                                        return {
                                            en: 'Must be a valid postcode',
                                            cy: 'WELSH ERROR'
                                        }[req.i18n.getLocale()];
                                    });
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
    title: {
        en: 'Who will benefit from your project',
        cy: '(WELSH) Who will benefit from your project'
    },
    summary: {
        en: `
            <h2>Who will benefit from your project</h2>
            <p>We want to hear more about the people who will benefit from your project.</p>
            <p>It's important to be as accurate as possible in your answers. We'll use this information to make better 
            decisions about how our funding supports people and communities. We'll also use it to tell people about 
            the impact of our funding and who it is reaching.</p><p>However, the information you provide here is not 
            assessed and will not be used to decide whether you will be awarded funding for your project.</p>
        `,
        cy: `
            <h2>(WELSH) Who will benefit from your project</h2>
            <p>We want to hear more about the people who will benefit from your project.</p>
            <p>It's important to be as accurate as possible in your answers. We'll use this information to make better 
            decisions about how our funding supports people and communities. We'll also use it to tell people about the 
            impact of our funding and who it is reaching.</p><p>However, the information you provide here is not 
            assessed and will not be used to decide whether you will be awarded funding for your project.</p>
        `
    },
    steps: [
        {
            title: {
                en: 'Number of people',
                cy: '(WELSH) Number of people'
            },
            fieldsets: [
                {
                    legend: {
                        en: 'Number of people',
                        cy: '(WELSH) Number of people'
                    },
                    fields: [
                        {
                            type: 'text',
                            name: 'beneficiary-numbers',
                            label: {
                                en: 'How many people will benefit from your project?',
                                cy: '(WELSH) How many people will benefit from your project?'
                            },
                            explanation: {
                                en: 'Please enter the exact figure, or the closest estimate.',
                                cy: '(WELSH) Please enter the exact figure, or the closest estimate.'
                            },
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
    title: {
        en: 'National Lottery Awards for All',
        cy: '(WELSH) National Lottery Awards for All'
    },
    isBilingual: true,
    sections: [sectionProject, sectionBeneficiaries],
    // processor: processor,
    startPage: { template: path.resolve(__dirname, './startpage') },
    successStep: { template: path.resolve(__dirname, './success') }
};
