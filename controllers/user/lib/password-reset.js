'use strict';
const path = require('path');

const { Users } = require('../../../db/models');
const { sendHtmlEmail } = require('../../../common/mail');
const { signTokenPasswordReset } = require('./jwt');
const { getAbsoluteUrl, localify } = require('../../../common/urls');
const logger = require('../../../common/logger').child({
    service: 'user'
});

async function processResetRequest(req, user, source = 'user') {
    const token = signTokenPasswordReset(user.id);

    logger.info('Password reset request attempted', {
        eventSource: source
    });

    const template = path.resolve(
        __dirname,
        '../views/emails/email-from-locale.njk'
    );

    const urlPath = localify(req.i18n.getLocale())(
        `/user/password/reset?token=${token}`
    );
    const resetUrl = getAbsoluteUrl(req, urlPath);
    const templateData = {
        body: req.i18n.__('user.forgottenPassword.email.body', resetUrl)
    };

    await sendHtmlEmail(
        { template: template, templateData: templateData },
        {
            name: 'user_password_reset',
            sendTo: user.username,
            subject: req.i18n.__('user.forgottenPassword.email.subject')
        }
    );

    await Users.updateIsInPasswordReset(user.id);

    if (req.body.returnToken) {
        // used for tests to verify reset password
        return { token };
    }
}

module.exports = {
    processResetRequest
};
