const { sendEmail } = require('../../../common/mail');
const { Users, ApplicationExpirations } = require('../../../db/models');

const fetchMailList = async (expiryApplications, reminderType) => {
    const applicationExpirationsData = [];

    const userIds = expiryApplications.map(application => {
        applicationExpirationsData.push({
            applicationId: application.id,
            expirationType: reminderType
        });
        return application.userId;
    });

    const expiryMailList = await Users.getUsernamesByUserIds(userIds);

    return { expiryMailList, applicationExpirationsData };
}

const handleMonthExpiry = async (monthExpiryApplications) => {
    try {

        // Fetch email addresses
        const {
            expiryMailList,
            applicationExpirationsData
        } = fetchMailList(monthExpiryApplications, 'ONE_MONTH_REMINDER');

        // Send Emails
        if (expiryMailList.length > 0) {
            await sendEmail({
                name: 'application_month_expiry',
                mailConfig: {
                    sendTo: appData.isNotProduction ? process.env.APPLICATION_EXPIRY_EMAIL : expiryMailList,
                    subject: 'Your Application is due to expire!',
                    type: 'html',
                    content: '<h1>Content needs to be decided</h1>'
                },
                mailTransport: null
            });
        }

        // create ApplicationExpirations records
        if (applicationExpirationsData.length > 0) {
            await ApplicationExpirations.createBulkExpiryApplications(applicationExpirationsData);
        }

    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    handleMonthExpiry
}
