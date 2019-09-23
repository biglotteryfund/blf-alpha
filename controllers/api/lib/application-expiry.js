'use strict';
const path = require('path');

const { sendHtmlEmail } = require('../../../common/mail');
const { PendingApplication, EmailQueue } = require('../../../db/models');
const {
    EXPIRY_EMAIL_REMINDERS
} = require('../../apply/awards-for-all/constants');
const {
    getEmailFor,
    getPhoneFor
} = require('../../apply/awards-for-all/lib/contacts');
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
const handleEmailQueue = async emailQueue => {
    logger.info('Handling email queue');

    if (appData.isNotProduction && !process.env.APPLICATION_EXPIRY_EMAIL) {
        throw new Error(
            'Missing environment variable APPLICATION_EXPIRY_EMAIL'
        );
    }

    const calcTimeToFinish = type => {
        const email = Object.values(EXPIRY_EMAIL_REMINDERS).find(
            email => email.key === type
        );
        return email ? email.label : EXPIRY_EMAIL_REMINDERS.ONE_DAY.label;
    };

    return await Promise.all(
        emailQueue.map(async emailToSend => {
            let returnObj = { emailSent: false, dbUpdated: false };

            const emailStatus = await sendHtmlEmail(
                {
                    template: path.resolve(__dirname, './expiry-email.njk'),
                    templateData: {
                        timeToFinishApp: calcTimeToFinish(
                            emailToSend.emailType
                        ),
                        projectName:
                            emailToSend.pendingApplication.applicationData
                                .projectName,
                        countryPhoneNumber: getPhoneFor(
                            emailToSend.pendingApplication.applicationData
                                .projectCountry
                        ),
                        countryEmail: getEmailFor(
                            emailToSend.pendingApplication.applicationData
                                .projectCountry
                        )
                    }
                },
                {
                    name: 'application_expiry',
                    sendTo: appData.isNotProduction
                        ? process.env.APPLICATION_EXPIRY_EMAIL
                        : emailToSend.pendingApplication.userDetails.username,
                    subject: `You have ${calcTimeToFinish(
                        emailToSend.emailType
                    )} to finish your application`
                }
            );

            if (emailStatus.response) {
                returnObj.emailSent = true;

                const dbStatus = (await EmailQueue.updateStatusToSent(
                    emailToSend.id
                ))[0];

                if (dbStatus === 1) {
                    returnObj.dbUpdated = true;
                    return returnObj;
                } else {
                    return returnObj;
                }
            } else {
                return returnObj;
            }
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
const handleExpired = async expiredApplications => {
    try {
        logger.info('Handling expired applications');
        const applicationIds = expiredApplications.map(
            application => application.id
        );

        return EmailQueue.deleteEmailQueues(applicationIds).then(async () => {
            const dbStatus = await PendingApplication.deleteApplications(
                applicationIds
            );
            return dbStatus === expiredApplications.length ? true : false;
        });
    } catch (err) {
        logger.error('Error handling expired applications: ', err);
        return { error: err.message };
    }
};

module.exports = {
    handleEmailQueue,
    handleExpired
};
