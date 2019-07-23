'use strict';
const path = require('path');

const { sendHtmlEmail } = require('../../../common/mail');
const { getAbsoluteUrl } = require('../../../common/urls');

const { signTokenActivate } = require('./jwt');

module.exports = async function sendActivationEmail(
    req,
    user,
    dateOfActivationAttempt = null
) {
    const token = signTokenActivate(user.id, dateOfActivationAttempt);

    const mailParams = {
        name: 'user_activate_account',
        sendTo: user.username,
        subject: `Activate your The National Lottery Community Fund website account`
    };

    const email = await sendHtmlEmail(
        {
            template: path.resolve(
                __dirname,
                '../views/emails/activate-account.njk'
            ),
            templateData: {
                locale: req.i18n.getLocale(),
                activateUrl: getAbsoluteUrl(
                    req,
                    `/user/activate?token=${token}`
                ),
                email: user.username
            }
        },
        mailParams
    );

    return {
        email: email,
        token: token,
        mailParams: mailParams
    };
};
