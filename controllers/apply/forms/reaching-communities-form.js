const createFormModel = require('./create-form-model');
const { check } = require('express-validator/check');

const formModel = createFormModel({
    id: 'reaching-communities-idea',
    title: 'Reaching Communities'
});

formModel.registerStep({
    name: 'Your Idea',
    fieldsets: [
        {
            legend: 'Tell Us Your Idea',
            fields: [
                {
                    type: 'textarea',
                    name: 'your-idea',
                    label: 'What do you want to do and what difference will it make?',
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
                        summary: 'Show example',
                        body: `
<p>We support organisations that share our values of being people-led, strengths-based and connected.</p>

<p>Across all of our funding in England, we are looking for ideas that cover at least one of our three priorities:</p>
<ul>
<li>Relationships – We will be looking for ideas that bring people together and strengthen relationships in and across communities.</li>
<li>Places and Spaces – We will be looking for ideas that support people to shape and sustain the places that matter to them, like a park, community centre or online network.</li>
<li>Early Action – We will be looking for ideas that support activity that empowers people to fulfil their potential, working to address problems at the earliest possible stage.</li>
</ul>
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
            legend: 'Where will your project take place?',
            fields: [
                {
                    label: 'Where will your project take place?',
                    type: 'checkbox',
                    options: [
                        {
                            label: 'North East',
                            value: 'North East'
                        },
                        {
                            label: 'North West',
                            value: 'North West'
                        },
                        {
                            label: 'Yorkshire and the Humber',
                            value: 'Yorkshire and the Humber'
                        },
                        {
                            label: 'East Midlands',
                            value: 'East Midlands'
                        },
                        {
                            label: 'West Midlands',
                            value: 'West Midlands'
                        },
                        {
                            label: 'East of England',
                            value: 'East of England'
                        },
                        {
                            label: 'London',
                            value: 'London'
                        },
                        {
                            label: 'South East',
                            value: 'South East'
                        },
                        {
                            label: 'South West',
                            value: 'South West'
                        }
                    ],
                    name: 'location',
                    validator: function(field) {
                        return check(field.name)
                            .escape()
                            .trim()
                            .not()
                            .isEmpty();
                    }
                }
            ]
        }
    ]
});

formModel.registerReviewStep({
    title: 'Check Your idea',
    proceedLabel: 'Submit Idea'
});

formModel.registerSuccessStep({
    title: 'We Have Received Your Idea',
    processor: function(data) {
        // Do something with the data
        console.log(data);
    }
});

module.exports = formModel;
