'use strict';
const AWS = require('aws-sdk');
const config = require('config');
const debug = require('debug')('biglotteryfund:mailer');
const htmlToText = require('html-to-text');
const juice = require('juice');
const nodemailer = require('nodemailer');
const path = require('path');
const Raven = require('raven');
const util = require('util');

const app = require('../server');

const SES = new AWS.SES({
    apiVersion: '2010-12-01',
    // @TODO: Migrate SES to eu-west-2?
    region: 'eu-west-1'
});

const CloudWatch = new AWS.CloudWatch({
    apiVersion: '2010-08-01',
    region: config.get('aws.region')
});

/**
 * Create Nodemailer SES transporter
 */
const transport = nodemailer.createTransport({ SES });

/**
 * inlineCss
 * Wrapper around juice, inline external CSS into provided HTML
 * @param {String} html
 */
function inlineCss(html) {
    const juiceResources = util.promisify(juice.juiceResources);
    return juiceResources(html, {
        webResources: {
            relativeTo: path.resolve(__dirname, '../public')
        }
    });
}

/**
 * generateHtmlEmail
 *
 * Given an email schema generate full email HTML
 * - Render template through express / template engine
 * - Generate full email HTML and return alongside the original schema
 *
 * @param {Object} emailData
 * e.g. {
 *   name: 'example,
 *   templateName: 'emails/someTemplate',
 *   templateData: { … }
 *   sendTo: 'example@example.com',
 *   subject: 'The greatest email ever'
 * ]
 */
function generateHtmlEmail(emailData) {
    const appRender = util.promisify(app.render.bind(app));
    return appRender(emailData.templateName, emailData.templateData).then(html => {
        return inlineCss(html).then(inlinedHtml => ({
            data: emailData,
            html: inlinedHtml
        }));
    });
}

function shouldSend() {
    return !process.env.DONT_SEND_EMAIL;
}

function recordSendMetric(name) {
    const currentEnv = config.util.getEnv('NODE_ENV').toUpperCase();
    const mailName = name.toUpperCase();
    return CloudWatch.putMetricData({
        Namespace: 'SITE/MAIL',
        MetricData: [
            {
                MetricName: `MAIL_SENT_${currentEnv}_${mailName}`,
                Dimensions: [
                    {
                        Name: 'MAIL_SENT',
                        Value: 'SEND_COUNT'
                    }
                ],
                Unit: 'Count',
                Value: 1.0
            }
        ]
    }).send();
}

function send({ name, subject, sendMode = 'to', sendTo, sendFrom, text, html }) {
    if (!name) {
        throw new Error('Must pass a name');
    }

    if (!subject) {
        throw new Error('Must pass a subject');
    }

    if (!sendTo) {
        throw new Error('Must pass a sendTo address');
    }

    const mailOptions = {
        from: `Big Lottery Fund <${config.get('emailSender')}>`,
        subject: subject
    };

    if (html) {
        mailOptions.html = html;
        mailOptions.text = htmlToText.fromString(html, {
            wordwrap: 130,
            hideLinkHrefIfSameAsText: true,
            ignoreImage: true
        });
    } else {
        if (!text) {
            throw new Error('Must pass text content');
        }

        mailOptions.text = text;
    }

    if (sendFrom) {
        mailOptions.from = sendFrom;
    }

    mailOptions[sendMode] = sendTo;

    if (shouldSend()) {
        debug(`sending mail`);
        return transport
            .sendMail(mailOptions)
            .then(response => {
                recordSendMetric(name);
                return response;
            })
            .catch(error => {
                Raven.captureMessage('Error sending email via SES', {
                    extra: error,
                    tags: {
                        feature: 'email'
                    }
                });
                return Promise.reject(error);
            });
    } else {
        debug(`[skipped] sending mail`);
        return Promise.resolve(mailOptions);
    }
}

/**
 * generateAndSend
 * @param {Array<Object>} emails
 * e.g. [{
 *   name: 'example',
 *   templateName: 'emails/someTemplate',
 *   templateData: { … }
 *   sendTo: 'example@example.com',
 *   subject: 'The greatest email ever'
 * ]]
 */
function generateAndSend(schemas) {
    const promises = schemas.map(schema => generateHtmlEmail(schema));
    return Promise.all(promises).then(emails => {
        const mailPromises = emails.map(email => {
            return send({
                name: email.data.name,
                sendTo: email.data.sendTo,
                sendFrom: email.data.sendFrom,
                subject: email.data.subject,
                html: email.html
            });
        });

        return Promise.all(mailPromises);
    });
}

module.exports = {
    generateHtmlEmail,
    generateAndSend,
    inlineCss,
    send,
    transport
};
