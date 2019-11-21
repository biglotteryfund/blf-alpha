'use strict';
const moment = require('moment');
const { oneLine } = require('common-tags');

const { FormModel } = require('../lib/form-model');
const DateField = require('../lib/field-types/date');
const Joi = require('../lib/joi-extensions');

module.exports = function({ locale = 'en', data = {} } = {}) {
    console.log(data);

    function fieldStartDate() {
        const minDate = moment().add('18', 'weeks');

        function formatAfterDate(format = 'D MMMM YYYY') {
            return minDate
                .clone()
                .locale(locale)
                .format(format);
        }

        return new DateField({
            locale: locale,
            name: 'startDate',
            label: 'When would you like to start your project?',
            explanation: oneLine`Don't worry, this can be an estimate.
                         But your project must start after
                         <strong>${formatAfterDate('DD MM YYYY')}.</strong>`,
            schema: Joi.dateParts()
                .minDate(minDate.format('YYYY-MM-DD'))
                .required(),
            messages: [
                {
                    type: 'base',
                    message: 'Enter a start date'
                },
                {
                    type: 'dateParts.minDate',
                    message: `Date you start the project must be after ${formatAfterDate()}`
                }
            ]
        });
    }

    function fieldEndDate() {
        return new DateField({
            locale: locale,
            name: 'endDate',
            label: 'When would you like to finish your project?',
            explanation: oneLine`Your project can finish up to 12 months after it starts.
                         It can even be as short as just one day`,
            schema: Joi.dateParts()
                .minDateRef(Joi.ref('startDate'))
                .rangeLimit(Joi.ref('startDate'), {
                    amount: '15',
                    unit: 'months'
                })
                .required(),
            messages: [
                {
                    type: 'base',
                    message: 'Enter an end date'
                },
                {
                    type: 'dateParts.minDateRef',
                    message: `Date you end the project must be on or after the start date`
                },
                {
                    type: 'dateParts.rangeLimit',
                    message: `Date you end the project must be within 15 months of the start date`
                }
            ]
        });
    }

    const allFields = {
        startDate: fieldStartDate(),
        endDate: fieldEndDate()
    };

    function stepProjectLength() {
        return {
            title: 'Project length',
            noValidate: true,
            fieldsets: [
                {
                    fields: [allFields.startDate, allFields.endDate]
                }
            ]
        };
    }

    const form = {
        title: 'Test form',
        allFields: allFields,
        schemaVersion: 'v0.2',
        forSalesforce() {
            return data;
        },
        sections: [
            {
                slug: 'your-project',
                title: 'Your project',
                summary: `Please tell us about your project in this section`,
                steps: [stepProjectLength()]
            }
        ]
    };

    return new FormModel(form, data, locale);
};
