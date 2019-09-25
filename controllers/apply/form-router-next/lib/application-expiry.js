'use strict';
const path = require('path');
const get = require('lodash/get');
const moment = require('moment');
const config = require('config');
const enableExpiration = config.get('awardsForAll.enableExpiration');

const { sendHtmlEmail } = require('../../../../common/mail');
const {
    PendingApplication,
    ApplicationEmailQueue
} = require('../../../../db/models');

const { getEmailFor, getPhoneFor } = require('../../../../common/contacts');

const {
    signTokenUnsubscribeApplicationEmails
} = require('../../../user/lib/jwt');
const { getAbsoluteUrl } = require('../../../../common/urls');

const appData = require('../../../../common/appData');
const logger = require('../../../../common/logger').child({
    service: 'application-expiry'
});

/**
 * Email Queue Handler:
 * Checks whether environment variable exists
 * Calculates time-to-finish-application value
 * Iterate through emailQueue, within which it:
 * -- Sends email
 * -- Updates db
 * returns an array of objects containing emailSent, dbUpdated for each queue
 */
const sendExpiryEmails = async (req, emailQueue, locale) => {
    logger.info('Handling email queue');

    if (appData.isNotProduction && !process.env.APPLICATION_EXPIRY_EMAIL) {
        throw new Error(
            'Missing environment variable APPLICATION_EXPIRY_EMAIL'
        );
    }

    return await Promise.all(
        emailQueue.map(async emailToSend => {
            let subjectLine = '';

            switch (emailToSend.emailType) {
                case 'AFA_ONE_MONTH':
                    subjectLine = {
                        en: 'You have one month to finish your application',
                        cy: ''
                    }[locale];
                    break;
                case 'AFA_ONE_WEEK':
                    subjectLine = {
                        en: 'You have one week to finish your application',
                        cy: ''
                    }[locale];
                    break;
                case 'AFA_ONE_DAY':
                    subjectLine = {
                        en: 'You have one day to finish your application',
                        cy: ''
                    }[locale];
                    break;
            }

            const mailParams = {
                name: 'application_expiry_afa',
                sendTo: appData.isNotProduction
                    ? process.env.APPLICATION_EXPIRY_EMAIL
                    : emailToSend.PendingApplication.user.username,
                subject: subjectLine
            };

            const getAppData = field =>
                get(emailToSend.PendingApplication, `applicationData.${field}`);

            const token = signTokenUnsubscribeApplicationEmails(
                emailToSend.PendingApplication.id
            );

            const unsubscribeUrl = getAbsoluteUrl(
                req,
                '/apply/emails/unsubscribe?token=' + token
            );

            let emailStatus = {};
            if (enableExpiration) {
                emailStatus = await sendHtmlEmail(
                    {
                        template: path.resolve(
                            __dirname,
                            '../views/expiry-email.njk'
                        ),
                        templateData: {
                            projectName: getAppData('projectName'),
                            countryPhoneNumber: getPhoneFor(
                                getAppData('projectCountry')
                            ),
                            countryEmail: getEmailFor(
                                getAppData('projectCountry')
                            ),
                            application: emailToSend.PendingApplication,
                            unsubscribeLink: unsubscribeUrl,
                            expiryDate: moment(
                                emailToSend.PendingApplication.expiresAt
                            )
                                .locale(locale)
                                .format('D MMMM, YYYY')
                        }
                    },
                    mailParams
                );
            } else {
                // Allow pre-launching this feature by simulating what it would have done
                emailStatus.response = 'PENDING';
            }

            let returnObj = { emailSent: false, dbUpdated: false };

            if (emailStatus.response || appData.isTestServer) {
                if (enableExpiration) {
                    returnObj.emailSent = true;

                    const dbStatus = (await ApplicationEmailQueue.updateStatusToSent(
                        emailToSend.id
                    ))[0];

                    if (dbStatus === 1) {
                        returnObj.dbUpdated = true;
                    }
                } else {
                    // Simulate a successful response but indicate no emails/deletions were made
                    returnObj = { emailSent: true, dbUpdated: true };
                    returnObj.wasSimulated = true;
                }
            }
            return returnObj;
        })
    );
};

/**
 * Handle expired applications:
 * Deletes all expired applications
 * DELETE promise returns number of records affected directly
 * returns truthy only if no. of del records = no. of expired applications
 */
const deleteExpiredApplications = async expiredApplications => {
    try {
        logger.info('Handling expired applications');

        if (enableExpiration) {
            const applicationIds = expiredApplications.map(
                application => application.id
            );

            const dbStatus = await PendingApplication.deleteApplications(
                applicationIds
            );
            return dbStatus === expiredApplications.length;
        } else {
            logger.info(
                `Simulated deleting ${expiredApplications.length} expired applications`
            );
            return true;
        }
    } catch (err) {
        logger.error('Error handling expired applications: ', err);
        return { error: err.message };
    }
};

module.exports = {
    sendExpiryEmails,
    deleteExpiredApplications
};
