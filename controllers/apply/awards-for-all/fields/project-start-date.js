'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const DateField = require('../../lib/field-types/date');

const { MIN_START_DATE } = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);

    const minDate = moment().add(MIN_START_DATE.amount, MIN_START_DATE.unit);

    function formatAfterDate(format = 'D MMMM YYYY') {
        return minDate
            .clone()
            .locale(locale)
            .format(format);
    }

    return new DateField({
        name: 'projectStartDate',

        label: 'When would you like to start your project?',
        explanation: oneLine`Don't worry, this can be an estimate.
            But your project must start after
            <strong>${formatAfterDate('DD MM YYYY')}.</strong>`,
        settings: {
            minYear: minDate.format('YYYY')
        },
        schema: Joi.dateParts()
            .minDate(minDate.format('YYYY-MM-DD'))
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a project start date',
                    cy: ''
                })
            },
            {
                type: 'dateParts.minDate',
                message: localise({
                    en: `Date you start the project must be on or after ${formatAfterDate()}`,
                    cy: ``
                })
            }
        ]
    });
};
