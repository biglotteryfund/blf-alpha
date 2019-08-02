'use strict';
const path = require('path');
const moment = require('moment');

const { sendHtmlEmail } = require('../../../common/mail');
const { getAbsoluteUrl, localify } = require('../../../common/urls');
const { Users } = require('../../../db/models');

const { signTokenActivate } = require('./jwt');

module.exports = async function sendActivationEmail(req, user) {
    const dateOfActivationAttempt = moment().unix();
    const token = signTokenActivate(user.id, dateOfActivationAttempt);

    const urlPath = localify(req.i18n.getLocale())(
        `/user/activate?token=${token}`
    );
    const activationUrl = getAbsoluteUrl(req, urlPath);

    const emailContent = {
        subject: req.i18n.__('user.activate.email.subject'),
        body: req.i18n.__(
            'user.activate.email.body',
            user.username,
            activationUrl
        )
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
                '../views/emails/email-from-locale.njk'
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
