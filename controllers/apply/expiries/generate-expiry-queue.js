'use strict';
const moment = require('moment');

module.exports = function generateExpiryQueue(application, expiryEmailPeriods) {
    return expiryEmailPeriods.map((emailConfig) => {
        return {
            applicationId: application.id,
            userId: application.userId,
            emailType: emailConfig.emailType,
            dateToSend: moment(application.expiresAt).subtract(
                emailConfig.sendBeforeExpiry.amount,
                emailConfig.sendBeforeExpiry.unit
            ),
        };
    });
};
