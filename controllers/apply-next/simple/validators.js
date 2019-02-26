'use strict';

const moment = require('moment');
const { check } = require('express-validator/check');

function localiseMessage(options) {
    return function(value, { req }) {
        return options[req.i18n.getLocale()];
    };
}

const MIN_APPLICANT_AGE = 16;

module.exports = {
    MIN_APPLICANT_AGE,
    optional: function(field) {
        return check(field.name)
            .trim()
            .optional();
    },
    required: function(message) {
        return function(field) {
            return check(field.name)
                .trim()
                .not()
                .isEmpty()
                .withMessage(localiseMessage(message));
        };
    },
    email: function(field) {
        return check(field.name)
            .trim()
            .isEmail()
            .withMessage(
                localiseMessage({
                    en: 'Please provide a valid email address',
                    cy: ''
                })
            );
    },
    emailRequired: function(field) {
        return check(field.name)
            .trim()
            .not()
            .isEmpty()
            .isEmail()
            .withMessage(
                localiseMessage({
                    en: 'Please provide a valid email address',
                    cy: ''
                })
            );
    },
    postcode: function(field) {
        return check(field.name)
            .isPostalCode('GB')
            .withMessage(
                localiseMessage({
                    en: 'Must be a valid postcode',
                    cy: 'WELSH ERROR'
                })
            );
    },
    futureDate: function(field) {
        const minFutureDate = field.min ? moment(field.min, 'YYYY-MM-DD') : moment();
        return check(field.name)
            .isAfter(minFutureDate.toISOString())
            .withMessage(
                localiseMessage({
                    en: 'Date must be in the future',
                    cy: 'WELSH ERROR'
                })
            );
    },
    pastDate: function(field) {
        return check(field.name)
            .isBefore(moment().toISOString())
            .withMessage(
                localiseMessage({
                    en: 'Date must be in the past',
                    cy: 'WELSH ERROR'
                })
            );
    },
    dateOfBirth: function(field) {
        return check(field.name)
            .isBefore(
                moment()
                    .subtract(MIN_APPLICANT_AGE, 'years')
                    .toISOString()
            )
            .withMessage(
                localiseMessage({
                    en: `Date of birth must be at least ${MIN_APPLICANT_AGE} years ago`,
                    cy: 'WELSH ERROR'
                })
            );
    }
};
