'use strict';
const jwt = require('jsonwebtoken');

const { JWT_SIGNING_TOKEN } = require('../../../common/secrets');
const { Users } = require('../../../db/models');

function signTokenActivate(userId, dateOfActivationAttempt) {
    const payload = {
        data: {
            userId: userId,
            reason: 'activate',
            dateOfActivationAttempt: dateOfActivationAttempt
        }
    };

    return jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '1h' // Short-lived token
    });
}

function verifyTokenActivate(token, userId) {
    return new Promise((resolve, reject) => {
        // We have to use try/catch here because jwt.verify() doesn't support async callbacks
        // @see https://stackoverflow.com/a/54419385
        try {
            const decoded = jwt.verify(token, JWT_SIGNING_TOKEN);
            Users.findByUserId(userId)
                .then(user => {
                    // Ensure that the token's stored date matches the one in the database
                    // (eg. it's the most recently-generated link)
                    const isNewestLink =
                        user.date_activation_sent ===
                        decoded.data.dateOfActivationAttempt;

                    if (
                        decoded.data.reason === 'activate' &&
                        decoded.data.userId === userId &&
                        isNewestLink
                    ) {
                        resolve(decoded.data);
                    } else {
                        reject(new Error('Invalid token reason'));
                    }
                })
                .catch(err => {
                    reject(err);
                });
        } catch (err) {
            reject(err);
        }
    });
}

function signTokenPasswordReset(userId) {
    const payload = { data: { userId: userId, reason: 'resetpassword' } };
    return jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '1h' // Short-lived token
    });
}

function verifyTokenPasswordReset(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SIGNING_TOKEN, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                if (decoded.data.reason === 'resetpassword') {
                    resolve(decoded.data);
                } else {
                    reject(new Error('Invalid token reason'));
                }
            }
        });
    });
}

module.exports = {
    signTokenActivate,
    verifyTokenActivate,
    signTokenPasswordReset,
    verifyTokenPasswordReset
};
