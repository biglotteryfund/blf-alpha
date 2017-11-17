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
                    rows: 6,
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
                        body:
                            '<p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Beatae pariatur explicabo architecto numquam non quis!</p>'
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
