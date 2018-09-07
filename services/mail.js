'use strict';
const path = require('path');
const config = require('config');
const AWS = require('aws-sdk');
const nunjucks = require('nunjucks');
const nodemailer = require('nodemailer');
const juice = require('juice');
const htmlToText = require('html-to-text');
const debug = require('debug')('biglotteryfund:mail');

const { countEvent } = require('../modules/metrics');

/**
 * @typedef {object} MailAddress
 * @property {string} [name]
 * @property {string} address
 */

/**
 * @typedef {object} MailConfig
 * @property {Array<MailAddress>} sendTo
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
                juice.juiceResources(html, { webResources: { relativeTo: publicRoot } }, function(juceErr, newHtml) {
                    /* istanbul ignore if  */
                    if (juceErr) {
                        reject(juceErr);
                    } else {
                        resolve(newHtml);
                    }
                });
            }
        });
    });
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
    const addressess = recipients.map(recipient => recipient.address);
    if (addressess.some(address => /@biglotteryfund.org.uk$/.test(address))) {
        return 'noreply@blf.digital';
    } else {
        return 'noreply@biglotteryfund.org.uk';
    }
}

/**
 * Build a nodemailer mail options object
 *
 * @param {MailConfig} mailConfig
 * @return {nodemailer.SendMailOptions}
 */
function buildMailOptions({ subject, type = 'text', content, sendTo = [], sendMode = 'to' }) {
    const sendFrom = getSendAddress(sendTo);

    const mailOptions = {
        from: `Big Lottery Fund <${sendFrom}>`,
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

    mailOptions[sendMode] = sendTo;

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
                const environment = config.util.getEnv('NODE_ENV').toUpperCase();
                countEvent({
                    namespace: 'SITE/MAIL',
                    metric: `MAIL_SENT_${environment}_${name.toUpperCase()}`,
                    name: 'MAIL_SENT',
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
    sendEmail
};
