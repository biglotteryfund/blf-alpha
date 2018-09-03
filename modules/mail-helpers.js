'use strict';
const htmlToText = require('html-to-text');

/**
 * Get send from address
 *
 * - If we are sending to a biglotteryfund domain use the blf.digital
 * - Otherwise, use the default send from address
 *
 * @param {String} recipient
 */
function getSendAddress(recipient) {
    if (/@biglotteryfund.org.uk$/.test(recipient)) {
        return 'noreply@blf.digital';
    } else {
        return 'noreply@biglotteryfund.org.uk';
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
 * Build mail options
 * @param {MailConfig} mailConfig
 */
function buildMailOptions({ subject, type = 'text', content, sendTo, sendMode = 'to', customSendFrom = null }) {
    const sendFrom = customSendFrom ? customSendFrom : getSendAddress(sendTo.address);

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

module.exports = {
    getSendAddress,
    buildMailOptions
};
