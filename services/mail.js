'use strict';
const path = require('path');
const config = require('config');
const AWS = require('aws-sdk');
const nunjucks = require('nunjucks');
const nodemailer = require('nodemailer');
const juice = require('juice');
const htmlToText = require('html-to-text');
const debug = require('debug')('biglotteryfund:mail');
const { isString, isArray } = require('lodash');

const metrics = require('../modules/metrics');

/**
 * @typedef {object} MailAddress
 * @property {string} [name]
 * @property {string} address
 */

/**
 * @typedef {object} MailConfig
 * @property {string|MailAddress|Array<MailAddress>} sendTo
 * @property {string} subject
 * @property {string} [type]
 * @property {string} content
 * @property {string} [sendMode]
 */

/**
 * Given an email schema generate full email HTML
 *
 * We use Nunjucks Simple API remotely to avoid initialising a full environment
 * either by attempting to share the express app view engine, or creating a new one.
 * The limitations are that no filters or global helpers are available.
 *
 * @param {object} options
 * @param {string} options.template
 * @param {object} options.templateData
 * @return {Promise<string>}
 */
function generateHtmlEmail({ template, templateData }) {
    return new Promise((resolve, reject) => {
        nunjucks.render(template, templateData, function(renderErr, html) {
            if (renderErr) {
                reject(renderErr);
            } else {
                const publicRoot = path.resolve(__dirname, '../public');
                juice.juiceResources(
                    html,
                    { removeStyleTags: false, webResources: { relativeTo: publicRoot } },
                    function(juiceErr, newHtml) {
                        /* istanbul ignore if */
                        if (juiceErr) {
                            reject(juiceErr);
                        } else {
                            resolve(newHtml);
                        }
                    }
                );
            }
        });
    });
}

/**
 * Utility function to generate an HTML email and send it.
 *
 *
 * @param {object} options
 * @param {string} options.template
 * @param {object} options.templateData
 * @param {object} mailParams
 * @return {object}
 */
async function sendHtmlEmail({ template, templateData }, mailParams) {
    const emailHtml = await generateHtmlEmail({ template, templateData });

    const mailConfig = {
        sendTo: mailParams.sendTo,
        subject: mailParams.subject,
        type: 'html',
        content: emailHtml
    };

    await sendEmail({
        name: mailParams.name,
        mailConfig: mailConfig
    });

    return mailConfig;
}

/**
 * Get send from address
 *
 * If we are sending to a biglotteryfund domain use the blf.digital,
 * otherwise use the default send from address.
 *
 * @param {Array<MailAddress>} recipients
 * @return {string}
 */
function getSendAddress(recipients) {
    const addresses = recipients.map(recipient => recipient.address);
    if (
        addresses.some(address => /@biglotteryfund.org.uk$/.test(address) || /@tnlcommunityfund.org.uk$/.test(address))
    ) {
        return 'noreply@blf.digital';
    } else {
        return 'noreply@tnlcommunityfund.org.uk';
    }
}

/**
 * Takes a string of one or more addresses,
 * e.g. 'example@example.com,another@example.com'
 * and converts it into an address object for nodemailer
 * @param {any} sendTo
 * @return {Array<MailAddress>}
 */
function normaliseSendTo(sendTo) {
    if (isString(sendTo) === true) {
        const addresses = sendTo.split(',');
        return addresses.map(address => ({ address }));
    } else if (isArray(sendTo) === true) {
        return sendTo;
    } else {
        return [sendTo];
    }
}

/**
 * Build a nodemailer mail options object
 *
 * @param {MailConfig} mailConfig
 * @return {nodemailer.SendMailOptions}
 */
function buildMailOptions({ subject, type = 'text', content, sendTo, sendMode = 'to' }) {
    const normalisedSendTo = normaliseSendTo(sendTo);
    const sendFrom = getSendAddress(normalisedSendTo);

    const mailOptions = {
        from: `The National Lottery Community Fund <${sendFrom}>`,
        subject: subject
    };

    if (type === 'html') {
        mailOptions.html = content;
        mailOptions.text = htmlToText.fromString(content, {
            wordwrap: 130,
            hideLinkHrefIfSameAsText: true,
            ignoreImage: true
        });
    } else if (type === 'text') {
        mailOptions.text = content;
    } else {
        throw new Error('Invalid type');
    }

    mailOptions[sendMode] = normalisedSendTo;

    return mailOptions;
}

/**
 * Create an instance of the default SES transport
 *
 * @return {nodemailer.Transporter}
 */
function createSesTransport() {
    const SES = new AWS.SES({
        apiVersion: '2010-12-01',
        region: 'eu-west-1' // SES only available for EU in eu-west-1
    });

    return nodemailer.createTransport({ SES });
}

/**
 * Send an email using the given transport and config
 *
 * @param options
 * @property {string} options.name
 * @property {MailConfig} options.mailConfig
 * @property {nodemailer.Transporter} options.mailTransport
 * @return {Promise<nodemailer.SentMessageInfo>}
 */
function sendEmail({ name, mailConfig, mailTransport = null }) {
    /**
     * Skip sending mail in test environments
     */
    if (!!process.env.DONT_SEND_EMAIL === true) {
        const reason = `skipped sending mail ${name}`;
        debug(reason);
        return Promise.resolve(reason);
    } else {
        /**
         * Use the provided mail transport if we have one,
         * otherwise use the default ses transport.
         */
        const transport = mailTransport ? mailTransport : createSesTransport();

        return transport.sendMail(buildMailOptions(mailConfig)).then(info => {
            /**
             * Record a send count as a CloudWatch event if enabled
             * istanbul ignore if
             */
            if (config.get('features.enableMailSendMetrics')) {
                metrics.count({
                    name: name,
                    namespace: 'SITE/MAIL',
                    dimension: 'MAIL_SENT',
                    value: 'SEND_COUNT'
                });
            }

            return info;
        });
    }
}

module.exports = {
    buildMailOptions,
    createSesTransport,
    generateHtmlEmail,
    getSendAddress,
    normaliseSendTo,
    sendEmail,
    sendHtmlEmail
};
