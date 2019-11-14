'use strict';
const express = require('express');
const path = require('path');
const jwt = require('jsonwebtoken');

const { ApplicationEmailQueue } = require('../../db/models');
const { JWT_SIGNING_TOKEN } = require('../../common/secrets');
const logger = require('../../common/logger').child({
    service: 'application-expiry'
});

const router = express.Router();

function verifyUnsubscribeToken(token) {
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

/**
 * Application email unsubscribe
 * Allows a user to remove any scheduled emails for them about an application
 */
router.get('/', async function(req, res) {
    if (req.query.token) {
        try {
            const unsubscribeRequest = await verifyUnsubscribeToken(
                req.query.token
            );
            const applicationId = unsubscribeRequest.applicationId;
            // delete scheduled emails then redirect with message
            await ApplicationEmailQueue.deleteEmailsForApplication(
                applicationId
            );
            logger.info('User unsubscribed from application expiry emails');
            res.render(
                path.resolve(__dirname, './views/unsubscribed'),
                {
                    en: {
                        title: 'Unsubscription successful',
                        message: `We will no longer email you about your application's expiration.`
                    },
                    cy: {
                        title: 'Tanysgrifiad llwyddiannus',
                        message: `Ni fyddwn yn eich e-bostio rhagor am derfyn amser eich cais.`
                    }
                }[req.i18n.getLocale()]
            );
        } catch (error) {
            logger.warn('Email unsubscribe token failed', {
                token: req.query.token
            });
            res.redirect(req.baseUrl);
        }
    } else {
        res.redirect(req.baseUrl);
    }
});

module.exports = router;
