const { sendEmail } = require('../../../common/mail');
const { Users, PendingApplication } = require('../../../db/models');
const { EXPIRY_EMAIL_REMINDERS } = require('../../apply/awards-for-all/constants');
const appData = require('../../../common/appData');
const logger = require('../../../common/logger').child({
    service: 'application-expiry'
});

const fetchMailList = async (expiryApplications) => {
    const userIds = expiryApplications.map(application => application.userId);
    const expiryMailList = await Users.getUsernamesByUserIds(userIds);

    return expiryMailList;
};

const sendExpiryEmail = async (expiryMailList) => {
    // TODO: Change the email content based on an expiryType param
    let status;

    if (expiryMailList.length > 0) {
        status = await sendEmail({
            name: 'application_expiry',
            mailConfig: {
                sendTo: appData.isNotProduction ? process.env.APPLICATION_EXPIRY_EMAIL : expiryMailList,
                subject: 'Your Application is due to expire!',
                type: 'html',
                content: '<h1>Content needs to be decided</h1>'
            }
        });
    }

    return (status.response) ? true : false;
};

const updateDb = async (expiryApplications, expiryWarning, emailStatus) => {
    let dbStatus;

    if (emailStatus) {
        const applicationIds = expiryApplications.map(application => application.id);
        dbStatus = await PendingApplication.updateExpiryWarning(applicationIds, expiryWarning);
    }

    return dbStatus[0] === expiryApplications.length ? true : false;
};

const handleMonthExpiry = async (monthExpiryApplications) => {
    try {
        logger.info('Handling monthly expiry applications');

        // Fetch email addresses
        const expiryMailList = await fetchMailList(monthExpiryApplications);
        
        // Send Emails
        const emailStatus = await sendExpiryEmail(expiryMailList);

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
        logger.error('Error handling monthly expiry applications', err);
        return err;
    }
};

const handleWeekExpiry = async (weekExpiryApplications) => {
    try {
        logger.info('Handling weekly expiry applications');

        // Fetch email addresses
        const expiryMailList = await fetchMailList(weekExpiryApplications);
        
        // Send Emails
        const emailStatus = await sendExpiryEmail(expiryMailList);

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
        logger.error('Error handling weekly expiry applications', err);
        return err;
    }
};

const handleDayExpiry = async (dayExpiryApplications) => {
    try {
        logger.info('Handling daily expiry applications');

        // Fetch email addresses
        const expiryMailList = await fetchMailList(dayExpiryApplications);
        
        // Send Emails
        const emailStatus = await sendExpiryEmail(expiryMailList);

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
        logger.error('Error handling daily expiry applications', err);
        return err;
    }
};

// TODO: Handling expired applications

module.exports = {
    handleMonthExpiry,
    handleWeekExpiry,
    handleDayExpiry
}
