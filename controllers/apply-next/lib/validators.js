'use strict';
const moment = require('moment');
const Joi = require('./joi-extensions');

function futureDate({ amount = null, unit = null } = {}) {
    const minDate = amount && unit ? moment().add(amount, unit) : moment();
    return Joi.dateParts().futureDate(minDate.format('YYYY-MM-DD'));
}

function dateOfBirth(minAge) {
    return Joi.dateParts().dob(minAge);
}

function budgetField(maxBudget) {
    return Joi.budgetItems()
        .maxBudget(maxBudget)
        .required();
}

function multiCheckbox(options) {
    return Joi.array()
        .items(Joi.string().valid(options.map(option => option.value)))
        .single()
        .required();
}

function postcode() {
    // via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
    const POSTCODE_PATTERN = '(gir\\s?0aa|[a-zA-Z]{1,2}\\d[\\da-zA-Z]?\\s?(\\d[a-zA-Z]{2})?)';

    return Joi.string()
        .trim()
        .regex(new RegExp(POSTCODE_PATTERN, 'i'));
}

function ukAddress() {
    return Joi.object({
        'building-street': Joi.string().required(),
        'town-city': Joi.string().required(),
        'county': Joi.string()
            .allow('')
            .optional(),
        'postcode': postcode().required()
    });
}

module.exports = {
    Joi,
    budgetField,
    dateOfBirth,
    futureDate,
    postcode,
    multiCheckbox,
    ukAddress
};
