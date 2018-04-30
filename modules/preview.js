'use strict';
const moment = require('moment');

function addPreviewStatus(res, data) {
    res.locals.preview = {
        isDraftOrVersion: data.status === 'draft' || data.status === 'version',
        lastUpdated: moment(data.dateUpdated.date).format('Do MMM YYYY [at] h:mma')
    };
}

module.exports = {
    addPreviewStatus
};
