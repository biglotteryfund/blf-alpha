const _ = require('lodash');
const { body } = require('express-validator/check');

const userBasePath = '/user';

// @TODO pass these through to templates
const userEndpoints = {
    dashboard: '/dashboard',
    register: '/register',
    login: '/login',
    logout: '/logout',
    activate: '/activate',
    requestpasswordreset: '/requestpasswordreset',
    resetpassword: '/resetpassword'
};

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

// generic function to return the user to the form with an error
const renderUserError = (msg, req, res, path) => {
    if (msg) {
        req.flash('formErrors', makeErrorList(msg));
    }
    req.session.save(() => {
        return res.redirect(userBasePath + path);
    });
};

// configure form validation
const PASSWORD_MIN_LENGTH = 8;
const emailPasswordValidations = [
    body('username')
        .exists()
        .not()
        .isEmpty()
        .withMessage('Please provide your email address')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .exists()
        .not()
        .isEmpty()
        .withMessage('Please provide a password')
        .isLength({ min: PASSWORD_MIN_LENGTH })
        .withMessage(`Please provide a password that is longer than ${PASSWORD_MIN_LENGTH} characters`)
        .matches(/\d/)
        .withMessage('Please provide a password that contains at least one number')
];

module.exports = {
    userBasePath,
    userEndpoints,
    makeErrorList,
    renderUserError,
    emailPasswordValidations
};
