'use strict';
const path = require('path');
const get = require('lodash/get');

const { sendHtmlEmail } = require('../../../common/mail');
const {
    PendingApplication,
    ApplicationEmailQueue
} = require('../../../db/models');
const {
    EXPIRY_EMAIL_REMINDERS
} = require('../../apply/awards-for-all/constants');
const {
    getEmailFor,
    getPhoneFor
} = require('../../apply/awards-for-all/lib/contacts');
const { signTokenUnsubscribeApplicationEmails } = require('../../user/lib/jwt');
const { getAbsoluteUrl } = require('../../../common/urls');

const appData = require('../../../common/appData');
const logger = require('../../../common/logger').child({
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

    const getLabelForEmailType = type => {
        const email = Object.values(EXPIRY_EMAIL_REMINDERS).find(
            email => email.key === type
        );
        return email
            ? email.label[locale]
            : EXPIRY_EMAIL_REMINDERS.ONE_DAY.label[locale];
    };

    return await Promise.all(
        emailQueue.map(async emailToSend => {
            let returnObj = { emailSent: false, dbUpdated: false };

            const mailParams = {
                name: 'application_expiry_afa',
                sendTo: appData.isNotProduction
                    ? process.env.APPLICATION_EXPIRY_EMAIL
                    : emailToSend.PendingApplication.user.username,
                subject: `You have ${getLabelForEmailType(
                    emailToSend.emailType
                )} to finish your application`
            };

            const getAppData = field =>
                get(emailToSend.PendingApplication, `applicationData.${field}`);

            const token = signTokenUnsubscribeApplicationEmails(
                emailToSend.PendingApplication.id
            );

            const unsubscribePath =
                '/apply/awards-for-all/emails/unsubscribe?token=' + token;
            const unsubscribeUrl = getAbsoluteUrl(req, unsubscribePath);

            const emailStatus = await sendHtmlEmail(
                {
                    template: path.resolve(__dirname, './expiry-email.njk'),
                    templateData: {
                        timeToFinishApp: getLabelForEmailType(
                            emailToSend.emailType
                        ),
                        projectName: getAppData('projectName'),
                        countryPhoneNumber: getPhoneFor(
                            getAppData('projectCountry')
                        ),
                        countryEmail: getEmailFor(getAppData('projectCountry')),
                        application: emailToSend.PendingApplication,
                        unsubscribeLink: unsubscribeUrl
                    }
                },
                mailParams
            );

            if (emailStatus.response || appData.isTestServer) {
                returnObj.emailSent = true;

                const dbStatus = (await ApplicationEmailQueue.updateStatusToSent(
                    emailToSend.id
                ))[0];

                if (dbStatus === 1) {
                    returnObj.dbUpdated = true;
                }
            }
            return returnObj;
        })
    );
};

/**
 * Handle Expired Applications:
 * First deletes the foreignKey references
 * Then, deletes all the expired applications (no emails sent)
 * DELETE promise returns number of records affected directly
 * returns truthy only if no. of del records = no. of expired applications
 */
const deleteExpiredApplications = async expiredApplications => {
    try {
        logger.info('Handling expired applications');
        const applicationIds = expiredApplications.map(
            application => application.id
        );

        const dbStatus = await PendingApplication.deleteApplications(
            applicationIds
        );
        return dbStatus === expiredApplications.length ? true : false;
    } catch (err) {
        logger.error('Error handling expired applications: ', err);
        return { error: err.message };
    }
};

module.exports = {
    sendExpiryEmails,
    deleteExpiredApplications
};
