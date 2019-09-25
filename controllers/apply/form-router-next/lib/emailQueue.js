'use strict';
const moment = require('moment');

function generateEmailQueueItems(application, expiryEmailPeriods) {
    return Object.values(expiryEmailPeriods).map(email => {
        return {
            applicationId: application.id,
            emailType: email.key,
            dateToSend: moment(application.expiresAt)
                .subtract(
                    email.periodBeforeExpiry.amount,
                    email.periodBeforeExpiry.unit
                )
                .hour(9)
                .minute(0)
                .second(0)
        };
    });
}

module.exports = {
    generateEmailQueueItems
};
