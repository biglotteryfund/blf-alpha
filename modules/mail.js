'use strict';

const AWS = require('aws-sdk');
const config = require('config');
const debug = require('debug')('blf-alpha:mailer');
const htmlToText = require('html-to-text');
const juice = require('juice');
const nodemailer = require('nodemailer');
const path = require('path');
const Raven = require('raven');
const util = require('util');

const appData = require('./appData');
const app = require('../server');

const AWS_REGION = config.get('aws.region');

const SES = new AWS.SES({
    apiVersion: '2010-12-01',
    region: AWS_REGION
});

const CloudWatch = new AWS.CloudWatch({
    apiVersion: '2010-08-01',
    region: AWS_REGION
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
 * genarateHtmlEmail
 *
 * Given an email schema generate full email HTML
 * - Render template through express / template engine
 * - Generate full email HTML and return alongside the original schema
 *
 * @param {Object} emailsToGenerate
 * e.g. {
 *   name: 'example,
 *   templateName: 'emails/someTempalte',
 *   templateData: { … }
 *   sendTo: 'example@example.com',
 *   subject: 'The greatest email ever'
 * ]
 */
function genarateHtmlEmail(emailData) {
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

        const currentEnv = appData.environment.toUpperCase();
        const mailName = name.toUpperCase();

        return transport
            .sendMail(mailOptions)
            .then(response => {
                CloudWatch.putMetricData({
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
                    ],
                    Namespace: 'SITE/MAIL'
                }).send();

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
 *   templateName: 'emails/someTempalte',
 *   templateData: { … }
 *   sendTo: 'example@example.com',
 *   subject: 'The greatest email ever'
 * ]]
 */
function generateAndSend(schemas) {
    const promises = schemas.map(schema => genarateHtmlEmail(schema));
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
    genarateHtmlEmail,
    generateAndSend,
    inlineCss,
    send,
    transport
};
