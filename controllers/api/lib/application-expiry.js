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

const sendExpiryEmail = async (expiryApplications, expiryType) => {

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

    const emailStatuses = await Promise.all(expiryApplications.map(async (application) => {
        const email = (await Users.findEmailByUserId(application.userId)).username;

        if (email) {
            return await sendHtmlEmail({
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
        }
    }));

    // Truthy if every email status has a response property
    return emailStatuses.every((status) => {
        if (status) {
          return (status.response);
        }
    });
};

const updateDb = async (expiryApplications, expiryWarning, emailStatus) => {
    let dbStatus;

    if (emailStatus) {
        const applicationIds = expiryApplications.map(application => application.id);

        // UPDATE promise returns an array containing number of records affected
        dbStatus = (await PendingApplication.updateExpiryWarning(applicationIds, expiryWarning))[0];
    }

    return dbStatus === expiryApplications.length ? true : false;
};

const deleteExpiredApplications = async (expiryApplications) => {
    const applicationIds = expiryApplications.map(application => application.id);

    // DELETE promise returns number of records affected directly
    const dbStatus = await PendingApplication.bulkDeleteApplications(applicationIds);

    return dbStatus === expiryApplications.length ? true : false;
};

const handleMonthExpiry = async (monthExpiryApplications) => {
    try {
        logger.info('Handling monthly expiry applications');
        
        // Fetch and Send Emails
        const emailStatus = await sendExpiryEmail(
            monthExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.MONTH
        );

        // Update db
        const dbStatus = await updateDb(
            monthExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.MONTH,
            emailStatus
        );

        return {
            emailSent: emailStatus,
            dbUpdated: dbStatus
        };
    } catch (err) {
        logger.error('Error handling monthly expiry applications: ', err);
        return { error: err.message };
    }
};

const handleWeekExpiry = async (weekExpiryApplications) => {
    try {
        logger.info('Handling weekly expiry applications');
        
        // Fetch and Send Emails
        const emailStatus = await sendExpiryEmail(
            weekExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.WEEK
        );

        // Update db
        const dbStatus = await updateDb(
            weekExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.WEEK,
            emailStatus
        );

        return {
            emailSent: emailStatus,
            dbUpdated: dbStatus
        };
    } catch (err) {
        logger.error('Error handling weekly expiry applications: ', err);
        return { error: err.message };
    }
};

const handleDayExpiry = async (dayExpiryApplications) => {
    try {
        logger.info('Handling daily expiry applications');
        
        // Fetch and Send Emails
        const emailStatus = await sendExpiryEmail(
            dayExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.DAY
        );

        // Update db
        const dbStatus = await updateDb(
            dayExpiryApplications,
            EXPIRY_EMAIL_REMINDERS.DAY,
            emailStatus
        );

        return {
            emailSent: emailStatus,
            dbUpdated: dbStatus
        };
    } catch (err) {
        logger.error('Error handling daily expiry applications: ', err);
        return { error: err.message };
    }
};

const handleExpired = async (expiredApplications) => {
    try {
        logger.info('Handling expired applications');

        // Update db
        const dbStatus = await deleteExpiredApplications(expiredApplications);

        return {
            dbUpdated: dbStatus
        };
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
