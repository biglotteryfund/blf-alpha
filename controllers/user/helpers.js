'use strict';
const jwt = require('jsonwebtoken');
const path = require('path');

const { sendHtmlEmail } = require('../../modules/mail');
const { getAbsoluteUrl } = require('../../modules/urls');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');

async function sendActivationEmail(req, user, isExisting = false) {
    const payload = { data: { userId: user.id, reason: 'activate' } };

    const token = jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '7d' // allow a week to activate
    });

    const mailParams = {
        name: 'user_activate_account',
        sendTo: user.username,
        subject: 'Activate your The National Lottery Community Fund website account'
    };

    const email = await sendHtmlEmail(
        {
            template: path.resolve(__dirname, './views/emails/activate-account.njk'),
            templateData: {
                locale: req.i18n.getLocale(),
                activateUrl: getAbsoluteUrl(req, `/user/activate?token=${token}`),
                email: user.username,
                isExisting: isExisting
            }
        },
        mailParams
    );

    return {
        email: email,
        token: token,
        mailParams: mailParams
    };
}

module.exports = {
    sendActivationEmail
};
