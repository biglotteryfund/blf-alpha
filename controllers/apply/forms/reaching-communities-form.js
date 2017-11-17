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

formModel.registerSuccessStep({
    title: 'Success',
    processor: function(data) {
        // Do something with the data
        console.log(data);
    }
});

module.exports = formModel;
