'use strict';
const debug = require('debug')('blf-alpha:mailer');
const nodemailer = require('nodemailer');
const config = require('config');
const path = require('path');
const AWS = require('aws-sdk');
const Raven = require('raven');
const juice = require('juice');
const htmlToText = require('html-to-text');

const renderHtmlEmail = html => {
    const options = {
        webResources: {
            relativeTo: path.resolve(__dirname, '../public')
        }
    };
    return new Promise((resolve, reject) => {
        juice.juiceResources(html, options, (err, inlinedHtml) => {
            if (err) {
                return reject(err);
            }
            resolve(inlinedHtml);
        });
    });
};

// create Nodemailer SES transporter
const transport = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01',
        region: 'eu-west-1'
    })
});

function shouldSend() {
    return !process.env.DONT_SEND_EMAIL;
}

const send = ({ subject, text, sendTo, sendMode, html, sendFrom }) => {
    // default sending is `to` (as opposed to `bcc` etc)
    if (!sendMode) {
        sendMode = 'to';
    }

    if (!subject && !text && !sendTo) {
        throw new Error('Must pass a subject, text content and send to address');
    }

    let mailOptions = {
        from: `Big Lottery Fund <${config.get('emailSender')}>`,
        subject: subject,
        text: text
    };

    if (html) {
        mailOptions.html = html;
        mailOptions.text = htmlToText.fromString(html, {
            wordwrap: 130,
            hideLinkHrefIfSameAsText: true,
            ignoreImage: true
        });
    }

    if (sendFrom) {
        mailOptions.from = sendFrom;
    }

    mailOptions[sendMode] = sendTo;

    if (shouldSend()) {
        debug(`sending mail`);
        return transport.sendMail(mailOptions).catch(error => {
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
};

module.exports = {
    transport,
    send,
    renderHtmlEmail
};
