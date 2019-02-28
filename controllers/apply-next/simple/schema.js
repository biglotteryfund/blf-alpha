'use strict';
const Joi = require('joi');
const moment = require('moment');

// via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
const postcode = Joi.string()
    .regex(/^(gir\s?0aa|[a-z]{1,2}\d[\da-z]?\s?(\d[a-z]{2})?)$/i)
    .description('postcode');

const dateFromNow = (amount, unit) =>
    moment()
        .add(amount, unit)
        .toISOString();

const dateBeforeNow = (amount, unit) =>
    moment()
        .subtract(amount, unit)
        .toISOString();

const schema = Joi.object().keys({
    // @TODO how to share this with the field?
    'project-start-date': Joi.date()
        .min(dateFromNow(12, 'weeks'))
        .required(),
    'project-postcode': postcode.required(),
    'your-idea': Joi.string().required(),
    'project-budget': Joi.string().required(),
    'project-total-costs': Joi.number().required(),
    'organisation-legal-name': Joi.string().required(),
    'organisation-address-building-street': Joi.string().required(),
    'organisation-address-town-city': Joi.string().required(),
    'organisation-address-county': Joi.string().required(),
    'organisation-address-postcode': postcode.required(),
    'organisation-type': Joi.string().required(),
    'charity-number': Joi.number(),
    'company-number': Joi.number(),
    // @TODO share this with the model
    'accounting-year-date': Joi.date().max('now'),
    'total-income-year': Joi.number().required(),
    'main-contact-name': Joi.string().required(),
    // @TODO share this with the model
    'main-contact-dob': Joi.date()
        .max(dateBeforeNow(16, 'years'))
        .required(),
    'main-contact-address-building-street': Joi.string().required(),
    'main-contact-address-town-city': Joi.string().required(),
    'main-contact-address-county': Joi.string().required(),
    'main-contact-address-postcode': postcode.required(),
    'main-contact-email': Joi.string()
        .email()
        .required(),
    'main-contact-phone': Joi.string().required(),
    'legal-contact-name': Joi.string().required(),
    // @TODO share this with the model
    'legal-contact-dob': Joi.date()
        .max(dateBeforeNow(16, 'years'))
        .required(),
    'legal-contact-address-building-street': Joi.string().required(),
    'legal-contact-address-town-city': Joi.string().required(),
    'legal-contact-address-county': Joi.string().required(),
    'legal-contact-address-postcode': postcode.required(),
    'legal-contact-email': Joi.string()
        .email()
        .required(),
    'legal-contact-phone': Joi.string().required(),
    'bank-account-name': Joi.string().required(),
    'bank-sort-code': Joi.number().required(),
    'bank-account-number': Joi.number().required(),
    'bank-building-society-number': Joi.number(),
    'bank-statement': Joi.string().required()
});

module.exports = schema;
