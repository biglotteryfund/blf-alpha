const { check } = require('express-validator/check');
const { castArray } = require('lodash');
const moment = require('moment');

const app = require('../../../server');
const mail = require('../../../modules/mail');
const createFormModel = require('./create-form-model');

const formModel = createFormModel({
    id: 'reaching-communities-idea',
    title: 'Apply For A Grant Over £10,000',
    shortCode: 'RC'
});

formModel.registerStep({
    name: 'Your Idea',
    fieldsets: [
        {
            legend: 'Find out how we can help you',
            fields: [
                {
                    type: 'textarea',
                    name: 'your-idea',
                    label: 'Briefly explain your idea and why it’ll make a difference',
                    isRequired: true,
                    rows: 12,
                    validator: function(field) {
                        return check(field.name)
                            .escape()
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Please tell us your idea');
                    },
                    helpText: {
                        body: `
<p>We support organisations that share our values of being people-led, strengths-based and connected.</p>

<p>Across all of our funding in England, we are looking for ideas that cover at least one of our three priorities:</p>
<ul>
<li>Relationships – We will be looking for ideas that bring people together and strengthen relationships in and across communities.</li>
<li>Places and Spaces – We will be looking for ideas that support people to shape and sustain the places that matter to them, like a park, community centre or online network.</li>
<li>Early Action – We will be looking for ideas that support activity that empowers people to fulfil their potential, working to address problems at the earliest possible stage.</li>
</ul>
`,
                        introduction: `
<p>Use the box below to tell us about your organisation, or your idea, and we will be in touch within 10 days to let you know if we can help. You don’t need to spend too much time on this – if it is something we can fund, this is just the start of the conversation.</p>
<p>If you have already read our guidance, and feel you have all the information to tell us your idea, you are welcome to insert this below and it will go to one of our funding officers.</p>
`
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Project Location',
    fieldsets: [
        {
            legend: 'Where will your project take place? (select all that apply)',
            fields: [
                {
                    label: 'Where will your project take place?',
                    type: 'checkbox',
                    options: [
                        {
                            label: 'North-East',
                            value: 'North-East'
                        },
                        {
                            label: 'North-West',
                            value: 'North-West'
                        },
                        {
                            label: 'Yorkshire and the Humber',
                            value: 'Yorkshire and the Humber'
                        },
                        {
                            label: 'Midlands',
                            value: 'Midlands'
                        },
                        {
                            label: 'London and South-East',
                            value: 'London and South-East'
                        },
                        {
                            label: 'Across England',
                            value: 'Across England'
                        }
                    ],
                    name: 'location',
                    validator: function(field) {
                        return check(field.name).custom(value => {
                            const values = castArray(value);
                            if (values.indexOf('Across England') !== -1 && values.length > 1) {
                                throw new Error('If you’ve selected Across England no other regions can be selected.');
                            } else {
                                return true;
                            }
                        });
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Your Organisation',
    fieldsets: [
        {
            legend: 'Your Organisation',
            fields: [
                {
                    type: 'text',
                    name: 'organisation-name',
                    label: 'Legal Name',
                    isRequired: true,
                    canBeDuplicated: true,
                    duplicateLabel: 'Add another organisation',
                    duplicateHelpText:
                        'If you’re working with other organisations to deliver your idea, list them below. If you don’t know yet we can discuss this later on.',
                    validator: function(field) {
                        return check(field.name)
                            .escape()
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Organisation must be provided');
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Your Details',
    fieldsets: [
        {
            legend: 'Your Details',
            fields: [
                {
                    type: 'text',
                    name: 'first-name',
                    label: 'First Name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .escape()
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('First-name must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'last-name',
                    label: 'Last Name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .escape()
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Last-name must be provided');
                    }
                },
                {
                    type: 'email',
                    name: 'email',
                    label: 'Email address',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Please provide your email address')
                            .isEmail()
                            .withMessage('Please provide a valid email address');
                    }
                }
            ]
        }
    ]
});

formModel.registerReviewStep({
    title: 'Check This Is Right',
    proceedLabel: 'Submit'
});

formModel.registerSuccessStep({
    title: 'We Have Received Your Idea',
    processor: function(formData) {
        return new Promise((resolve, reject) => {
            let summary = formModel.getStepsWithValues(formData);
            let flatData = formModel.getStepValuesFlattened(formData);
            const dateNow = moment().format('dddd, MMMM Do YYYY, h:mm:ss a');

            let to = `${flatData['first-name']} ${flatData['first-name']} <${flatData['email']}>`;

            // generate HTML for email
            app.render(
                'emails/applicationSummary',
                {
                    summary: summary,
                    form: formModel,
                    data: flatData
                },
                (err, html) => {
                    if (err) {
                        reject(err);
                    }
                    mail
                        .send({
                            html: html,
                            sendTo: to,
                            sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
                            subject: `Your Reaching Communities application - ${dateNow}`
                        })
                        .catch(err => reject(err))
                        .then(() => resolve(formData));
                }
            );
        });
    }
});

module.exports = formModel;
