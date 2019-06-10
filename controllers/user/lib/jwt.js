'use strict';
const jwt = require('jsonwebtoken');

const { JWT_SIGNING_TOKEN } = require('../../../common/secrets');

function signTokenActivate(userId) {
    const payload = { data: { userId: userId, reason: 'activate' } };

    return jwt.sign(payload, JWT_SIGNING_TOKEN, {
        expiresIn: '7d' // allow a week to activate
    });
}

function verifyTokenActivate(token, userId) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SIGNING_TOKEN, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                if (
                    decoded.data.reason === 'activate' &&
                    decoded.data.userId === userId
                ) {
                    resolve(decoded.data);
                } else {
                    reject(new Error('Invalid token reason'));
                }
            }
        });
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
