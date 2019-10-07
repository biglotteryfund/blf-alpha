'use strict';
const jwt = require('jsonwebtoken');

const { JWT_SIGNING_TOKEN } = require('../../../../common/secrets');

function signTokenUnsubscribeApplicationEmails(applicationId) {
    const payload = {
        data: {
            applicationId: applicationId,
            action: 'unsubscribe'
        }
    };
    return jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '30d'
    });
}

function verifyTokenUnsubscribeApplicationEmails(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SIGNING_TOKEN, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                if (decoded.data.action === 'unsubscribe') {
                    resolve(decoded.data);
                } else {
                    reject(new Error('Invalid email unsubscribe token action'));
                }
            }
        });
    });
}

module.exports = {
    signTokenUnsubscribeApplicationEmails,
    verifyTokenUnsubscribeApplicationEmails
};
