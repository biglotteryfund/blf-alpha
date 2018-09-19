'use strict';
const jsonwebtoken = require('jsonwebtoken');
const { body } = require('express-validator/check');

const { sendEmail } = require('../../services/mail');
const { getAbsoluteUrl } = require('../../modules/urls');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');

// configure form validation
const PASSWORD_MIN_LENGTH = 8;
const validators = {
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

async function sendActivationEmail(req, user) {
    const payload = { data: { userId: user.id, reason: 'activate' } };
    const token = jsonwebtoken.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '7d' // allow a week to activate
    });

    const activateUrl = getAbsoluteUrl(req, `/user/activate/?token=${token}`);

    const mailConfig = {
        name: 'user_activate_account',
        subject: 'Activate your Big Lottery Fund website account',
        type: 'text',
        content: `Please click the following link to activate your account: ${activateUrl}`,
        sendTo: user.username
    };

    // @TODO should we alert users to errors here?
    await sendEmail({
        name: 'user_activate_account',
        mailConfig: mailConfig
    });

    return {
        email: mailConfig,
        token: token
    };
}

module.exports = {
    validators,
    sendActivationEmail
};
