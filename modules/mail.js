'use strict';
const nodemailer = require('nodemailer');
const config = require('config');
const getSecret = require('../modules/get-secret');

let mailConfig = {
    user: getSecret('ses.auth.user'),
    password: getSecret('ses.auth.password')
};
// create reusable transporter object using the default SMTP transport
const transport = nodemailer.createTransport({
    service: 'SES-EU-WEST-1',
    auth: {
        user: mailConfig.user,
        pass: mailConfig.password
    }
});

const send = ({ subject, text, sendTo, sendMode }) => {
    // default sending is `to` (as opposed to `bcc` etc)
    if (!sendMode) {
        sendMode = 'to';
    }

    if (!subject && !text && !sendTo) {
        throw new Error('Must pass a subject, text content and send to address');
    }

    // @TODO allow HTML emails
    let mailOptions = {
        from: `Big Lottery Fund <${config.get('emailSender')}>`,
        subject: subject,
        text: text
    };

    mailOptions[sendMode] = sendTo;

    // don't trigger an email if we're testing something
    if (process.env.DONT_SEND_EMAIL) {
        return mailOptions;
    }

    // send mail with defined transport object
    transport.sendMail(mailOptions, (error, info) => {
        if (error) {
            // @TODO handle this better – re-send it?
            return console.error('Error sending email via SES', error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
};

module.exports = {
    transport: transport,
    send: send
};
