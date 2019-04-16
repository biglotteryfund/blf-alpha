'use strict';
const jwt = require('jsonwebtoken');
const path = require('path');

const { sendHtmlEmail } = require('../../services/mail');
const { getAbsoluteUrl } = require('../../modules/urls');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');

async function sendActivationEmail(req, user) {
    const payload = { data: { userId: user.id, reason: 'activate' } };

    const token = jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '7d' // allow a week to activate
    });

    const email = await sendHtmlEmail(
        {
            template: path.resolve(__dirname, './views/emails/activate-account.njk'),
            templateData: {
                getAbsoluteUrl: str => getAbsoluteUrl(req, str),
                locale: req.i18n.getLocale(),
                activateUrl: getAbsoluteUrl(req, `/user/activate?token=${token}`),
                email: user.username
            }
        },
        {
            name: 'user_activate_account',
            sendTo: user.username,
            subject: 'Activate your The National Lottery Community Fund website account'
        }
    );

    return {
        email: email,
        token: token
    };
}

module.exports = {
    sendActivationEmail
};
