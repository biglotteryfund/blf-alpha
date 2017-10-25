'use strict';
const nodemailer = require('nodemailer');
const config = require('config');
const secrets = require('../modules/secrets');

let mailConfig = {
    user: secrets['ses.auth.user'],
    password: secrets['ses.auth.password']
};

// create reusable transporter object using the default SMTP transport
const transport = nodemailer.createTransport({
    service: 'SES-EU-WEST-1',
    auth: {
        user: mailConfig.user,
        pass: mailConfig.password
    }
});

const send = (text, subject) => {
    let mailOptions = {
        from: config.get('emailSender'),
        bcc: config.get('materialSupplierEmail'),
        subject: subject,
        text: text
    };

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
    send: send,
    transport: transport
};
