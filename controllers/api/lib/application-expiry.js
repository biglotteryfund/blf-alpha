'use strict';
const path = require('path');
const { sendHtmlEmail } = require('../../../common/mail');
const { Users, PendingApplication } = require('../../../db/models');
const { EXPIRY_EMAIL_REMINDERS } = require('../../apply/awards-for-all/constants');
const { getEmailFor, getPhoneFor } = require('../../apply/awards-for-all/lib/contacts');
const appData = require('../../../common/appData');
const logger = require('../../../common/logger').child({
    service: 'application-expiry'
});

/**
 * Common Expiry Handler:
 * Checks whether environment variable exists
 * Calculates time-to-finish-application value based on expiry type
 * Iterate through applications, within which it:
 * -- Fetches email addresses
 * -- Sends emails
 * -- Updates db
 * returns a array of objects containing emailSent, dbUpdated for each application
 */
const commonExpiryHandler = async (expiryApplications, expiryType) => {

    if (appData.isNotProduction && !process.env.APPLICATION_EXPIRY_EMAIL) {
        throw new Error('Missing environment variable APPLICATION_EXPIRY_EMAIL');
    }

    const timeToFinishApp = ((type) => {
        switch(type) {
          case EXPIRY_EMAIL_REMINDERS.MONTH:
            return 'one month';
          case EXPIRY_EMAIL_REMINDERS.WEEK:
            return 'two weeks';
          default:
            return 'two days';
        }
    })(expiryType);

    return await Promise.all(expiryApplications.map(async (application) => {
        let returnObj = { emailSent: false, dbUpdated: false };

        const email = (await Users.findEmailByUserId(application.userId)).username;
        logger.info(`Retrieved email address: ${application.id}-${expiryType}`);

        if (email) {
            const emailStatus = await sendHtmlEmail({
                template: path.resolve(__dirname, './expiry-email.njk'),
                templateData: {
                    timeToFinishApp,
                    projectName: application.applicationData.projectName,
                    countryPhoneNumber: getPhoneFor(application.applicationData.projectCountry),
                    countryEmail: getEmailFor(application.applicationData.projectCountry)
                }
            }, {
                name: 'application_expiry',
                sendTo: appData.isNotProduction ? process.env.APPLICATION_EXPIRY_EMAIL : email,
                subject: `You have ${timeToFinishApp} to finish your application`
            });

            if (emailStatus.response) {
                logger.info(`Email sent: ${application.id}-${expiryType}`);
                returnObj.emailSent = true;
                const dbStatus = (await PendingApplication.updateExpiryWarning(application.id, expiryType))[0];

                if (dbStatus === 1) {
                    logger.info(`Database updated: ${application.id}-${expiryType}`);
                    returnObj.dbUpdated = true;
                    return returnObj;
                } else {
                    return returnObj;
                }
            } else {
                return returnObj;
            }
        } else {
            return returnObj;
        }
    }));
};

/**
 * Delete Expired Applications:
 * Deletes all the expired applications (no emails sent)
 * returns truthy only if no. of del records = no. of expired applications
 */
const deleteExpiredApplications = async (expiryApplications) => {
    const applicationIds = expiryApplications.map(application => application.id);

    // DELETE promise returns number of records affected directly
    const dbStatus = await PendingApplication.bulkDeleteApplications(applicationIds);

    return dbStatus === expiryApplications.length ? true : false;
};

/**
 * Month Expiry Handler:
 * calls the common expiry handler
 * returns truthy only if every application has sent email and updated db
 */
const handleMonthExpiry = async (monthExpiryApplications) => {
    try {
        logger.info('Handling monthly expiry applications');

        const statuses = await commonExpiryHandler(
            monthExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.MONTH
        );

        return statuses.every((status) => {
            return (status.emailSent && status.dbUpdated);
        });
    } catch (err) {
        logger.error('Error handling monthly expiry applications: ', err);
        return { error: err.message };
    }
};

/**
 * Week Expiry Handler:
 * calls the common expiry handler
 * returns truthy only if every application has sent email and updated db
 */
const handleWeekExpiry = async (weekExpiryApplications) => {
    try {
        logger.info('Handling weekly expiry applications');

        const statuses = await commonExpiryHandler(
            weekExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.WEEK
        );

        return statuses.every((status) => {
            return (status.emailSent && status.dbUpdated);
        });
    } catch (err) {
        logger.error('Error handling weekly expiry applications: ', err);
        return { error: err.message };
    }
};

/**
 * Day Expiry Handler:
 * calls the common expiry handler
 * returns truthy only if every application has sent email and updated db
 */
const handleDayExpiry = async (dayExpiryApplications) => {
    try {
        logger.info('Handling daily expiry applications');

        const statuses = await commonExpiryHandler(
            dayExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.DAY
        );

        return statuses.every((status) => {
            return (status.emailSent && status.dbUpdated);
        });
    } catch (err) {
        logger.error('Error handling daily expiry applications: ', err);
        return { error: err.message };
    }
};

/**
 * Expired Handler:
 * Deletes all the expired applications (no emails sent)
 * returns the result of deleteExpiredApplications
 */
const handleExpired = async (expiredApplications) => {
    try {
        logger.info('Handling expired applications');
        return await deleteExpiredApplications(expiredApplications);
    } catch (err) {
        logger.error('Error handling expired applications: ', err);
        return { error: err.message };
    }
};

module.exports = {
    handleMonthExpiry,
    handleWeekExpiry,
    handleDayExpiry,
    handleExpired
};
