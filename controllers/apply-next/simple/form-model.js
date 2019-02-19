'use strict';
const path = require('path');

const { check } = require('express-validator/check');

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
                            isRequired: true,
                            validator: function(field) {
                                return check(field.name)
                                    .trim()
                                    .isEmail()
                                    .withMessage('Please provide a valid email address');
                            }
                        }
                    ]
                }
            ]
        },
        {
            title: 'Location',
            fieldsets: [
                {
                    fields: [
                        {
                            type: 'text',
                            name: 'phone-number',
                            autocompleteName: 'tel',
                            isRequired: true
                        }
                    ]
                }
            ]
        }
    ]
};

module.exports = {
    title: 'National Lottery Awards for All',
    isBilingual: false,
    sections: [sectionBeneficiaries],
    // processor: processor,
    startPage: { template: path.resolve(__dirname, './startpage') },
    successStep: { template: path.resolve(__dirname, './success') }
};
