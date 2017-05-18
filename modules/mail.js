'use strict';
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const config = require('config');

let mailConfig = {
    user: process.env.SES_USER,
    password: process.env.SES_PASSWORD
};

try {
    mailConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../config/mail.json'), 'utf8'));
} catch (e) {
    console.info('mail.json not found -- are you in DEV mode?');
}

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: "SES-EU-WEST-1",
    auth: {
        user: mailConfig.user,
        pass: mailConfig.password
    }
});

const send = (text, subject) => {

    let mailOptions = {
        // @TODO is this the right from address?
        from: 'matt.andrews@biglotteryfund.org.uk',
        to: config.get('materialSupplierEmail'),
        subject: subject,
        text: text
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error('Error sending email via SES', error);
        }
        console.log('Message %s sent: %s', info.messageId, info.response);
    });
};

module.exports = {
    send: send
};