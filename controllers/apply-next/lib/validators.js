'use strict';
const moment = require('moment');
const Joi = require('../joi-extensions');

function yesOrNo() {
    return Joi.string()
        .valid(['yes', 'no'])
        .required();
}

function singleChoice(options) {
    return Joi.string().valid(options.map(option => option.value));
}

function multiChoice(options) {
    return Joi.array()
        .items(Joi.string().valid(options.map(option => option.value)))
        .single();
}

function futureDate({ amount = null, unit = null } = {}) {
    const minDate = amount && unit ? moment().add(amount, unit) : moment();
    return Joi.dateParts().futureDate(minDate.format('YYYY-MM-DD'));
}

function budgetItems(maxBudget) {
    return Joi.budgetItems()
        .maxBudget(maxBudget)
        .required();
}

function ukAddress() {
    return Joi.object({
        'building-street': Joi.string().required(),
        'town-city': Joi.string().required(),
        'county': Joi.string()
            .allow('')
            .optional(),
        'postcode': Joi.string()
            .postcode()
            .required()
    });
}

function ukPhoneNumber() {
    return Joi.string().phoneNumber({
        defaultCountry: 'GB',
        format: 'national'
    });
}

module.exports = {
    Joi,
    budgetItems,
    futureDate,
    multiChoice,
    singleChoice,
    ukAddress,
    ukPhoneNumber,
    yesOrNo
};
