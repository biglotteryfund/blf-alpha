'use strict';
const path = require('path');
const moment = require('moment');

const { sendHtmlEmail } = require('../../../common/mail');
const { getAbsoluteUrl } = require('../../../common/urls');
const { Users } = require('../../../db/models');

const { signTokenActivate } = require('./jwt');

module.exports = async function sendActivationEmail(
    req,
    user
) {
    const dateOfActivationAttempt = moment().unix();
    const token = signTokenActivate(user.id, dateOfActivationAttempt);

    const activationUrl = getAbsoluteUrl(
        req,
        `/user/activate?token=${token}`
    );

    const emailContent = {
        subject: req.i18n.__('user.activate.email.subject'),
        body: req.i18n.__('user.activate.email.body', user.username, activationUrl)
    };

    const mailParams = {
        name: 'user_activate_account',
        sendTo: user.username,
        subject: emailContent.subject
    };

    const email = await sendHtmlEmail(
        {
            template: path.resolve(
                __dirname,
                '../views/emails/activate-account.njk'
            ),
            templateData: {
                body: emailContent.body
            }
        },
        mailParams
    );

    await Users.updateDateOfActivationAttempt({
        id: user.id,
        dateOfActivationAttempt: dateOfActivationAttempt
    });

    return {
        email: email,
        token: token,
        mailParams: mailParams
    };
};
