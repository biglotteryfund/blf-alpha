'use strict';
const AWS = require('aws-sdk');
const config = require('config');
const debug = require('debug')('biglotteryfund:mail');

const juice = require('juice');
const nodemailer = require('nodemailer');
const path = require('path');
const Raven = require('raven');
const util = require('util');

const app = require('../server');
const { buildMailOptions } = require('../modules/mail-helpers');

const SES = new AWS.SES({
    apiVersion: '2010-12-01',
    region: 'eu-west-1' // SES only available for EU in eu-west-1
});

const CloudWatch = new AWS.CloudWatch({
    apiVersion: '2010-08-01',
    region: config.get('aws.region')
});

function recordSendMetric(name) {
    if (config.get('features.enableMailSendMetrics')) {
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
}

// Sync with modules/mail-helpers.js
/**
 * @typedef {object} MailConfig
 * @property {object} sendTo
 * @property {string} [sendTo.name]
 * @property {string} sendTo.address
 * @property {string} subject
 * @property {string} [type]
 * @property {string} content
 * @property {string} [sendMode]
 * @property {string} [customSendFrom]
 */

/**
 *
 * @param {string} name
 * @param {MailConfig} mailConfig
 */
function send(name, mailConfig, customTransport = null) {
    const transport = customTransport ? customTransport : nodemailer.createTransport({ SES });

    if (!name) {
        throw new Error('Must pass a name');
    }

    if (!!process.env.DONT_SEND_EMAIL === true) {
        debug(`[skipped] sending mail`);
        return Promise.resolve(null);
    } else {
        debug(`sending mail for ${name}`);

        const mailOptions = buildMailOptions(mailConfig);

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
    }
}

/**
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
 * Given an email schema generate full email HTML
 * @param {string} template
 * @param {object} templateData
 */
function generateHtmlEmail(template, templateData) {
    const appRender = util.promisify(app.render.bind(app));
    return appRender(template, templateData).then(html => {
        return inlineCss(html);
    });
}

/**
 * @typedef {object} HtmlEmailSchema
 * @property {string} name
 * @property {object} sendTo
 * @property {string} [sendTo.name]
 * @property {string} sendTo.address
 * @property {string} subject
 * @property {string} template
 * @property {object} templateData
 */

/**
 * generateAndSend
 * @param {HtmlEmailSchema} schema
 */
async function generateAndSend(schema, customTransport = null) {
    const html = await generateHtmlEmail(schema.template, schema.templateData);
    return send(
        schema.name,
        {
            sendTo: schema.sendTo,
            subject: schema.subject,
            type: 'html',
            content: html
        },
        customTransport
    );
}

module.exports = {
    generateHtmlEmail,
    generateAndSend,
    send
};
