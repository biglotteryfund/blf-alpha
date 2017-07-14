'use strict';
const nodemailer = require('nodemailer');
const config = require('config');
const secrets = require('../modules/secrets');

let mailConfig = {
    user: secrets['ses.auth.user'],
    password: secrets['ses.auth.password']
};

let transporter = false;

const send = (text, subject) => {

    // only initialise this when we need it
    if (!transporter) {
        // create reusable transporter object using the default SMTP transport
        transporter = nodemailer.createTransport({
            service: "SES-EU-WEST-1",
            auth: {
                user: mailConfig.user,
                pass: mailConfig.password
            }
        });
    }

    let mailOptions = {
        from: 'noreply@biglotteryfund.org.uk',
        bcc: config.get('materialSupplierEmail'),
        subject: subject,
        text: text
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            // @TODO handle this better – re-send it?
            return console.error('Error sending email via SES', error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
};

module.exports = {
    send: send
};