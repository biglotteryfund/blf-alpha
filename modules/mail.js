'use strict';
const config = require('config');
const nodemailer = require('nodemailer');

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    service: "SES-EU-WEST-1",
    auth: {
        user: config.get('ses.auth.user'),
        pass: config.get('ses.auth.password')
    }
});

const send = (text, subject) => {

    // setup email data with unicode symbols
    let mailOptions = {
        from: 'matt.andrews@biglotteryfund.org.uk',
        to: 'matt@mattandrews.info',
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