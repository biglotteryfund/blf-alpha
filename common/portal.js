'use strict';
const moment = require('moment');
const path = require('path');

/**
 * Serves a holding/downtime page for the AFA portal if redirected here
 */
module.exports = (req, res, next) => {
    const downtimeEndDate = moment('2019-09-23');
    const re = /^apply\./;
    if (re.test(req.get('host'))) {
        res.cacheControl = { noStore: true };
        res.status(403);
        res.render(path.resolve(__dirname, '../views/static-pages/downtime'), {
            title: 'Down for maintenance',
            endDate: moment(downtimeEndDate).format('dddd, MMMM Do YYYY')
        });
    } else {
        next();
    }
};
