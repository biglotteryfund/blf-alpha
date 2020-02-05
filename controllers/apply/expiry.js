'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const get = require('lodash/get');

const {
    ApplicationEmailQueue,
    PendingApplication
} = require('../../db/models');

const {
    getIntroTitle,
    getSenderName,
    getSubjectLineForEmail,
    getEditLink
} = require('./lib/email-helpers');

const appData = require('../../common/appData');
const {
    EMAIL_EXPIRY_TEST_ADDRESS,
    EMAIL_EXPIRY_SECRET,
    JWT_SIGNING_TOKEN
} = require('../../common/secrets');
const { getAbsoluteUrl } = require('../../common/urls');
const { sendHtmlEmail } = require('../../common/mail');

const logger = require('../../common/logger').child({
    service: 'application-expiry'
});

const router = express.Router();

function signUnsubscribeToken(applicationId) {
    return jwt.sign(
        {
            data: {
                applicationId: applicationId,
                action: 'unsubscribe'
            }
        },
        JWT_SIGNING_TOKEN,
        { expiresIn: '30d' }
    );
}

function getEmailFor(country) {
    const countryEmail = {
        'scotland': 'advicescotland@tnlcommunityfund.org.uk',
        'northern-ireland': 'enquiries.ni@tnlcommunityfund.org.uk',
        'wales': 'wales@tnlcommunityfund.org.uk'
    }[country];

    return countryEmail || 'general.enquiries@tnlcommunityfund.org.uk';
}

function getPhoneFor(country) {
    const countryPhone = {
        'scotland': '0300 123 7110',
        'northern-ireland': '028 9055 1455',
        'wales': '0300 123 0735'
    }[country];

    return countryPhone || '0345 4 10 20 30';
}

/**
 * Email Queue Handler:
 * Checks whether environment variable exists
 * Calculates time-to-finish-application value
 * Iterate through emailQueue, within which it:
 * -- Sends email
 * -- Updates db
 * returns an array of objects containing emailSent, dbUpdated for each queue
 */
async function sendExpiryEmails(req, emailQueue) {
    logger.info('Handling email queue');

    if (appData.isNotProduction && !EMAIL_EXPIRY_TEST_ADDRESS) {
        throw new Error('Missing secret EMAIL_EXPIRY_TEST_ADDRESS');
    }

    return await Promise.all(
        emailQueue.map(async emailToSend => {
            const formId = emailToSend.PendingApplication.formId;

            function getAppData(field) {
                return get(
                    emailToSend.PendingApplication,
                    `applicationData.${field}`
                );
            }

            function getProjectCountry() {
                if (formId === 'awards-for-all') {
                    return getAppData('projectCountry');
                } else if (formId === 'standard-enquiry') {
                    const countries = getAppData('projectCountries');
                    return countries && countries.length === 1
                        ? countries[0]
                        : 'Multiple';
                }
            }

            function getBilingualStatus() {
                if (formId === 'awards-for-all') {
                    return getAppData('projectCountry') === 'wales';
                } else if (formId === 'standard-enquiry') {
                    const countries = getAppData('projectCountries');
                    return countries && countries.includes('wales');
                }
            }

            function getEmailName() {
                if (formId === 'awards-for-all') {
                    return 'application_expiry_afa';
                } else if (formId === 'standard-enquiry') {
                    return 'application_expiry_standard';
                }
            }

            const projectCountry = getProjectCountry();
            const isBilingual = getBilingualStatus();

            let subjectLine = getSubjectLineForEmail(emailToSend.emailType);
            // Combine subject lines for bilingual emails
            subjectLine = isBilingual
                ? [subjectLine.en, subjectLine.cy].join(' / ')
                : subjectLine.en;

            const addressToSendTo = appData.isNotProduction
                ? EMAIL_EXPIRY_TEST_ADDRESS
                : emailToSend.PendingApplication.user.username;

            const mailParams = {
                name: getEmailName(),
                sendTo: addressToSendTo,
                subject: subjectLine
            };

            const token = signUnsubscribeToken(
                emailToSend.PendingApplication.id
            );

            const dateFormat = 'D MMMM, YYYY HH:mm:ss';
            const expiresOn = moment(emailToSend.PendingApplication.expiresAt);

            const expiryDates = {
                en: expiresOn.format(dateFormat),
                cy: expiresOn.locale('cy').format(dateFormat)
            };

            const baseLink = `/apply/emails/unsubscribe?token=${token}`;
            const unsubscribeUrl = {
                en: getAbsoluteUrl(req, baseLink),
                cy: getAbsoluteUrl(req, `/welsh${baseLink}`)
            };

            let emailStatus = await sendHtmlEmail(
                {
                    template: path.resolve(
                        __dirname,
                        './emails/expiry-email.njk'
                    ),
                    templateData: {
                        isBilingual: isBilingual,
                        projectName: getAppData('projectName'),
                        countryPhoneNumber: getPhoneFor(projectCountry),
                        countryEmail: getEmailFor(projectCountry),
                        application: emailToSend.PendingApplication,
                        unsubscribeLink: unsubscribeUrl,
                        expiryDate: expiryDates,
                        introLine: getIntroTitle(formId),
                        editLink: getEditLink(
                            formId,
                            emailToSend.PendingApplication.id
                        ),
                        senderName: getSenderName(formId)
                    }
                },
                mailParams
            );

            if (emailStatus.response || appData.isTestServer) {
                const dbStatus = await ApplicationEmailQueue.updateStatusToSent(
                    emailToSend.id
                );

                return { emailSent: true, dbUpdated: dbStatus[0] === 1 };
            } else {
                return { emailSent: false, dbUpdated: false };
            }
        })
    );
}

/**
 * Handle expired applications:
 * Deletes all expired applications
 * DELETE promise returns number of records affected directly
 * returns truthy only if no. of del records = no. of expired applications
 */
async function deleteExpiredApplications(expiredApplications) {
    try {
        logger.info('Handling expired applications');

        const ids = expiredApplications.map(application => application.id);

        const dbStatus = await PendingApplication.deleteBatch(ids);

        const status = expiredApplications.map(application => {
            logger.info(`Deleting expired application`, {
                formId: application.formId,
                applicationStatus: application.currentProgressState
            });
            return {
                applicationDeleted: true
            };
        });

        return dbStatus === expiredApplications.length ? status : false;
    } catch (err) {
        logger.error('Error handling expired applications: ', err);
        return { error: err.message };
    }
}

/**
 * API: Application Expiry handler
 *
 * Emails users with pending expirations and deletes applications which have expired
 */
router.post('/', async (req, res) => {
    if (req.body.secret !== EMAIL_EXPIRY_SECRET && !appData.isTestServer) {
        return res.status(403).json({ error: 'Invalid secret' });
    }

    try {
        let response = {};

        const [emailQueue, expiredApplications] = await Promise.all([
            ApplicationEmailQueue.getEmailsToSend(),
            PendingApplication.findExpiredApplications()
        ]);

        if (emailQueue.length > 0) {
            response.emailQueue = await sendExpiryEmails(req, emailQueue);
        } else {
            response.emailQueue = [];
        }

        if (expiredApplications.length > 0) {
            response.expired = await deleteExpiredApplications(
                expiredApplications
            );
        } else {
            response.expired = [];
        }

        logger.info('application expiries processed', {
            emailsSent: response.emailQueue.length,
            expiredAppsDeleted: response.expired.length
        });

        res.json(response);
    } catch (error) {
        res.status(400).json({
            err: error.message
        });
    }
});

module.exports = router;
