'use strict';
const moment = require('moment');

/**
 * Serves a holding/downtime page for the AFA portal if redirected here
 */
module.exports = (req, res, next) => {

    const downtimeEndDate = moment('2018-05-29');

    const getDateInLocale = locale => {
        return moment(downtimeEndDate).locale(locale).format('dddd Do MMMM YYYY');
    };

    const endDates = {
        'en': getDateInLocale('en'),
        'cy': getDateInLocale('cy')
    };

    const re = /^apply\./;
    if (re.test(req.get('host'))) {
        res.cacheControl = { noStore: true };
        res.status(403);
        return res.render('downtime', {
            title: 'Down for maintenance / Wrthi’n cynnal a chadw\n',
            endDates: endDates
        });
    } else {
        next();
    }
};
