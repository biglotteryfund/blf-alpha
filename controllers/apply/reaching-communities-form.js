'use strict';

const { get, isArray } = require('lodash');
const { check } = require('express-validator/check');

const { createFormModel } = require('../helpers/create-form-model');
const { HUB_EMAILS } = require('../../modules/secrets');
const appData = require('../../modules/appData');
const mail = require('../../modules/mail');

const DEFAULT_EMAIL = HUB_EMAILS.england;

const PROJECT_LOCATIONS = [
    {
        label: 'North East & Cumbria',
        value: 'North East & Cumbria',
        explanation: 'covering Newcastle, Cumbria and the north-east of England',
        email: HUB_EMAILS.northEastCumbria
    },
    {
        label: 'North West',
        value: 'North West',
        explanation: 'covering Greater Manchester, Lancashire, Cheshire and Merseyside',
        email: HUB_EMAILS.northWest
    },
    {
        label: 'Yorkshire and the Humber',
        value: 'Yorkshire and the Humber',
        explanation: 'covering Yorkshire, north and north-east Lincolnshire',
        email: HUB_EMAILS.yorksHumber
    },
    {
        label: 'South West',
        value: 'South West',
        explanation: 'covering Exeter, Bristol and the south-west of England',
        email: HUB_EMAILS.southWest
    },
    {
        label: 'London, South-East and East of England',
        value: 'London and South East',
        email: HUB_EMAILS.londonSouthEast
    },
    {
        label: 'East and West Midlands',
        value: 'Midlands',
        email: HUB_EMAILS.midlands
    }
];

const formModel = createFormModel({
    id: 'reaching-communities-idea',
    title: 'Reaching Communities & Partnerships',
    shortCode: 'RC'
});

formModel.registerStartPage({
    template: 'pages/apply/reaching-communities-startpage'
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
<p>We support ideas that meet our three funding priorities.</p>
<p>Show us how you plan to:</p>
<ul>
<li>bring people together and build strong relationships in and across communities
<li>improve the places and spaces that matter to communities</li>
<li>enable more people to fulfil their potential by working to address issues at the earliest possible stage.</li>
</ul>

<p>Through all of our funding in England we support ideas that:</p>
<ul>
<li>bring people together and build strong relationships in and across communities</li>
<li>improve the places and spaces that matter to communities</li>
<li>enable more people to fulfil their potential by working to address issues at the earliest possible stage</li>
</ul>
`,
                        introduction: `
<p>Use the box below to tell us about your organisation, or your idea, and we will be in touch within fifteen working days to let you know if we can help. You don’t need to spend too much time on this – if it is something we can fund, this is just the start of the conversation.</p>
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
    internalOrder: 3,
    fieldsets: [
        {
            legend: 'Where will your project take place?',
            fields: [
                {
                    label: 'Select all regions that apply',
                    type: 'checkbox',
                    options: PROJECT_LOCATIONS,
                    isRequired: true,
                    name: 'location',
                    validator: function(field) {
                        return check(field.name)
                            .not()
                            .isEmpty()
                            .withMessage('Project region must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'project-location',
                    label: "In your own words, describe the location(s) that you'll be running your project(s) in",
                    placeholder: 'eg. "Newcastle community centre" or "Alfreton, Derby and Ripley"',
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
    internalOrder: 2,
    fieldsets: [
        {
            legend: 'Your organisation',
            fields: [
                {
                    type: 'text',
                    name: 'organisation-name',
                    label: 'Legal name',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Organisation must be provided');
                    }
                },
                {
                    type: 'text',
                    name: 'additional-organisations',
                    label: 'Add another organisation',
                    explanation:
                        'If you’re working with other organisations to deliver your idea, list them below. If you don’t know yet we can discuss this later on.',
                    isRequired: false,
                    size: 60,
                    validator: function(field) {
                        return check(field.name).trim();
                    }
                }
            ]
        }
    ]
});

formModel.registerStep({
    name: 'Your details',
    internalOrder: 1,
    fieldsets: [
        {
            legend: 'Your details',
            fields: [
                {
                    type: 'text',
                    name: 'first-name',
                    autocompleteName: 'given-name',
                    label: 'First name',
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
                    autocompleteName: 'family-name',
                    label: 'Last name',
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
                    autocompleteName: 'email',
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
                },
                {
                    type: 'text',
                    name: 'phone-number',
                    autocompleteName: 'tel',
                    label: 'Phone number',
                    isRequired: true,
                    validator: function(field) {
                        return check(field.name)
                            .trim()
                            .not()
                            .isEmpty()
                            .withMessage('Please provide a contact telephone number');
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
    message: `
<h2 class="t2 t--underline accent--pink">What happens next?</h2>
<p>Thank you for submitting your idea. A local funding officer will contact you within fifteen working days.</p>
`,
    processor: function(formData) {
        const flatData = formModel.getStepValuesFlattened(formData);
        const summary = formModel.getStepsWithValues(formData);

        /**
         * Construct a primary address (i.e. customer email)
         */
        const primaryAddress = `${flatData['first-name']} ${flatData['last-name']} <${flatData['email']}>`;

        /**
         * Determine which internal address to send to:
         * - If in test then send to primaryAddress
         * - If multi-region, send to defailt/england-wide inbox
         * - Otherwise send to the matching inbox for the selected region
         */
        const internalAddress = (function() {
            if (appData.isNotProduction) {
                return primaryAddress;
            } else if (isArray(flatData.location)) {
                return DEFAULT_EMAIL;
            } else {
                const matchedLocation = PROJECT_LOCATIONS.find(l => l.value === flatData.location);
                return get(matchedLocation, 'email', DEFAULT_EMAIL);
            }
        })();

        return mail.generateAndSend([
            {
                name: 'reaching_communities_customer',
                sendTo: primaryAddress,
                sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
                subject: 'Thank you for getting in touch with the Big Lottery Fund!',
                templateName: 'emails/applicationSummary',
                templateData: {
                    summary: summary,
                    form: formModel,
                    data: flatData
                }
            },
            {
                name: 'reaching_communities_internal',
                sendTo: internalAddress,
                sendFrom: 'Big Lottery Fund <noreply@blf.digital>',
                subject: 'New idea submission from website',
                templateName: 'emails/applicationSummaryInternal',
                templateData: {
                    summary: formModel.orderStepsForInternalUse(summary),
                    form: formModel,
                    data: flatData
                }
            }
        ]);
    }
});

formModel.registerErrorStep({
    title: 'There was an problem submitting your idea',
    message: `
<p>There was a problem submitting your idea, we have been notified of the problem.</p>
<p>Please return to the review step and try again. If you still see an error please call <a href="tel:03454102030">0345 4 10 20 30</a> (Monday–Friday 9am–5pm).</p>
`
});

module.exports = formModel;
