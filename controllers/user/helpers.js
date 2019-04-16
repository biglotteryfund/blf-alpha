'use strict';
const jwt = require('jsonwebtoken');
const path = require('path');

const { generateHtmlEmail, sendEmail } = require('../../services/mail');
const { getAbsoluteUrl } = require('../../modules/urls');
const { JWT_SIGNING_TOKEN } = require('../../modules/secrets');

async function sendActivationEmail(req, user) {
    const payload = { data: { userId: user.id, reason: 'activate' } };
    const token = jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '7d' // allow a week to activate
    });

    const emailHtml = await generateHtmlEmail({
        template: path.resolve(__dirname, './views/emails/activate-account.njk'),
        templateData: {
            locale: req.i18n.getLocale(),
            activateUrl: getAbsoluteUrl(req, `/user/activate?token=${token}`),
            email: user.username
        }
    });

    const mailConfig = {
        sendTo: user.username,
        subject: 'Activate your The National Lottery Community Fund website account',
        type: 'html',
        content: emailHtml
    };

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
