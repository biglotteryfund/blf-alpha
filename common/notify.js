'use strict';
const config = require('config');
const uuidv4 = require('uuid/v4');
const GovNotifyClient = require('notifications-node-client').NotifyClient;

const enableGovNotifyEmails = config.get('features.enableGovNotifyEmails');
const { GOV_NOTIFY_KEY } = require('../common/secrets');
const notifyClient = new GovNotifyClient(GOV_NOTIFY_KEY);

// The email address replies should go to by default
const DEFAULT_REPLY_TO_ID = '18f1a2ac-4a2f-4cf4-8a0b-524fbe3eaac1';

// The list of enabled email campaigns in gov.uk Notify
const EMAIL_TEMPLATES = [
    {
        name: 'user_activate_account',
        templateId: {
            en: 'e87a903f-51a1-450d-a7f7-75acb54f0b02',
            cy: '7dbd7820-e4f8-4f87-a614-1b5d0b19e75e'
        },
        personalisation: function(mailParams, templateData) {
            return {
                emailAddress: mailParams.sendTo,
                expiryDate: templateData.expiryDate,
                activationUrl: templateData.activationUrl,
                loginUrl: templateData.loginUrl
            };
        }
    },
    {
        name: 'user_password_reset',
        templateId: {
            en: 'c66db247-8c32-496c-a5e5-2632b602c46c',
            cy: '649cb6fb-74a8-4a4d-aed8-fcfddb498ba4'
        },
        personalisation: function(mailParams, templateData) {
            return {
                resetUrl: templateData.resetUrl
            };
        }
    },
    {
        name: 'user_password_reset_success',
        templateId: {
            en: '515989c0-c861-4206-ab3e-6ba4ff4ada13',
            cy: 'd056eaa4-3217-4d5a-932e-129275d31b0b'
        }
    }
];

// @TODO HTML emails to send:
/*
 * application_expiry_afa
 * material_customer
 * material_supplier
 * digital_fund_assistance
 */

function canSendNotifyEmail(emailName) {
    return (
        EMAIL_TEMPLATES.map(_ => _.name).includes(emailName) &&
        enableGovNotifyEmails
    );
}

function sendNotifyEmail(locale, mailParams, templateData) {
    const emailConfig = EMAIL_TEMPLATES.find(_ => _.name === mailParams.name);
    if (!emailConfig) {
        throw new Error('Must provide an email config for this message');
    }
    const personalisation = emailConfig.personalisation
        ? emailConfig.personalisation(mailParams, templateData)
        : {};

    const templateId = emailConfig.templateId[locale];
    if (!templateId) {
        throw new Error(
            'Must provide a templateId when using named email config'
        );
    }

    return notifyClient.sendEmail(templateId, mailParams.sendTo, {
        personalisation: personalisation,
        reference: `${mailParams.name}-${uuidv4()}`,
        emailReplyToId: emailConfig.replyToId
            ? emailConfig.replyToId
            : DEFAULT_REPLY_TO_ID
    });
}

module.exports = {
    canSendNotifyEmail,
    sendNotifyEmail
};
