'use strict';
const nodemailer = require('nodemailer');
const config = require('config');
const AWS = require('aws-sdk');
const Raven = require('raven');

// create Nodemailer SES transporter
const transport = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01',
        region: 'eu-west-1'
    })
});

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
        delete mailOptions.text; // @TODO produce text version from HTML
    }

    if (sendFrom) {
        mailOptions.from = sendFrom;
    }

    mailOptions[sendMode] = sendTo;

    // don't trigger an email if we're testing something
    if (process.env.DONT_SEND_EMAIL) {
        return mailOptions;
    }

    // send mail with defined transport object
    let mailSend = transport.sendMail(mailOptions);

    // set a generic error logger
    mailSend.catch(error => {
        Raven.captureMessage('Error sending email via SES', {
            extra: error,
            tags: {
                feature: 'email'
            }
        });
    });

    return mailSend;
};

module.exports = {
    transport: transport,
    send: send
};
