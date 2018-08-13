'use strict';
const _ = require('lodash');
const { body } = require('express-validator/check');
const Raven = require('raven');

const userBasePath = '/user';

const userEndpoints = {
    dashboard: '/dashboard',
    register: '/register',
    login: '/login',
    logout: '/logout',
    activate: '/activate',
    requestpasswordreset: '/request-password-reset',
    resetpassword: '/reset-password'
};

const STATUSES = {
    ACTIVATION_SENT: 'activationSent',
    PASSWORD_RESET_REQUESTED: 'passwordResetRequest',
    PASSWORD_UPDATED: 'passwordUpdated',
    LOGGED_OUT: 'loggedOut'
};

const makeUserLink = page => userBasePath + userEndpoints[page];

// convert a single error string into a list
// or return an express-validator pre-formatted list
const makeErrorList = error => {
    if (_.isArray(error)) {
        return error;
    } else {
        return [
            {
                msg: error
            }
        ];
    }
};

// configure form validation
const PASSWORD_MIN_LENGTH = 8;
const formValidations = {
    emailAddress: body('username')
        .exists()
        .not()
        .isEmpty()
        .withMessage('Please provide your email address')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    password: body('password')
        .exists()
        .not()
        .isEmpty()
        .withMessage('Please provide a password')
        .isLength({ min: PASSWORD_MIN_LENGTH })
        .withMessage(`Please provide a password that is longer than ${PASSWORD_MIN_LENGTH} characters`)
        .matches(/\d/)
        .withMessage('Please provide a password that contains at least one number')
};

const emailPasswordValidations = [formValidations.emailAddress, formValidations.password];

const trackError = msg => {
    if (msg) {
        Raven.captureMessage(msg, {
            tags: {
                feature: 'user-auth'
            }
        });
    }
};

module.exports = {
    userBasePath,
    userEndpoints,
    makeUserLink,
    makeErrorList,
    emailPasswordValidations,
    formValidations,
    trackError,
    STATUSES
};
