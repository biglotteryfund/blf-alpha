const { check } = require('express-validator/check');
const { castArray } = require('lodash');
const Raven = require('raven');

const app = require('../../../server');
const mail = require('../../../modules/mail');
const createFormModel = require('./create-form-model');
const { EMAIL_REACHING_COMMUNITIES } = require('../../../modules/secrets');

const formModel = createFormModel({
    id: 'reaching-communities-idea',
    title: 'Reaching Communities & Partnerships',
    shortCode: 'RC'
});

formModel.registerStep({
    name: 'Your idea',
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
<p>Use the box below to tell us about your organisation, or your idea, and we will be in touch within 24 hours to let you know if we can help. You don’t need to spend too much time on this – if it is something we can fund, this is just the start of the conversation.</p>
<p>If you have already read our guidance, and feel you have all the information to tell us your idea, you are welcome to insert this below and it will go to one of our funding officers.</p>
`
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Project location',
    fieldsets: [
        {
            legend: 'Where will your project take place? (select all that apply)',
            fields: [
                {
                    label: 'Where will your project take place?',
                    type: 'checkbox',
                    options: [
                        {
                            label: 'North East',
                            value: 'North-East'
                        },
                        {
                            label: 'North West',
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
                },
                {
                    type: 'text',
                    name: 'project-location',
                    label: "In your own words, describe the location(s) that you'll be running your project(s) in",
                    placeholder: 'eg. "Newtown community centre" or "Alfreton, Derby and Ripley"',
                    isRequired: true,
                    size: 60,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Project location must be provided');
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Your organisation',
    fieldsets: [
        {
            legend: 'Your organisation',
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
    name: 'Your details',
    fieldsets: [
        {
            legend: 'Your details',
            fields: [
                {
                    type: 'text',
                    name: 'first-name',
                    label: 'First Name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('First name must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'last-name',
                    label: 'Last Name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Last name must be provided');
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
    title: 'Check this is right',
    proceedLabel: 'Submit'
});

formModel.registerSuccessStep({
    title: 'We have received your idea',
    processor: function(formData) {
        return new Promise((resolve, reject) => {
            const summary = formModel.getStepsWithValues(formData);
            const flatData = formModel.getStepValuesFlattened(formData);
            const to = `${flatData['first-name']} ${flatData['first-name']} <${flatData['email']}>`;

            /**
             * Render a Nunjucks template to a string and
             * convert the string to inline HTML
             */
            app.render(
                'emails/applicationSummary',
                {
                    summary: summary,
                    form: formModel,
                    data: flatData
                },
                (errorRenderingTemplate, html) => {
                    if (errorRenderingTemplate) {
                        return reject(errorRenderingTemplate);
                    }

                    mail
                        .renderHtmlEmail(html)
                        .then(inlinedHtml => {
                            mail
                                .send({
                                    html: inlinedHtml,
                                    // BCC internal staff
                                    sendTo: [to].concat(EMAIL_REACHING_COMMUNITIES.split(',')),
                                    sendMode: 'bcc',
                                    sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
                                    subject: `Thank you for getting in touch with the Big Lottery Fund!`
                                })
                                .catch(mailSendError => reject(mailSendError))
                                .then(() => resolve(formData));
                        })
                        .catch(err => {
                            Raven.captureMessage('Error converting template to inline CSS', {
                                extra: err,
                                tags: {
                                    feature: 'reaching-communities'
                                }
                            });
                            return reject(err);
                        });
                }
            );
        });
    }
});

module.exports = formModel;
