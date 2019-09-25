'use strict';
const moment = require('moment');

function generateEmailQueueItems(application, expiryEmailPeriods) {
    return Object.values(expiryEmailPeriods).map(email => {
        return {
            applicationId: application.id,
            emailType: email.key,
            dateToSend: moment(application.expiresAt).subtract(
                email.periodBeforeExpiry.amount,
                email.periodBeforeExpiry.unit
            )
        };
    });
}

module.exports = {
    generateEmailQueueItems
};
