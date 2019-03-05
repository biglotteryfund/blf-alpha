'use strict';
const jsonwebtoken = require('jsonwebtoken');

const { sendEmail } = require('../../services/mail');
const { getAbsoluteUrl } = require('../../modules/urls');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');

async function sendActivationEmail(req, user) {
    const payload = { data: { userId: user.id, reason: 'activate' } };
    const token = jsonwebtoken.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '7d' // allow a week to activate
    });

    const activateUrl = getAbsoluteUrl(req, `/user/activate/?token=${token}`);

    const mailConfig = {
        name: 'user_activate_account',
        subject: 'Activate your The National Lottery Community Fund website account',
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
    sendActivationEmail
};
