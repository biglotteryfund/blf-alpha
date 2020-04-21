'use strict';
const moment = require('moment');
const { parse } = require('json2csv');

module.exports = function (responses) {
    const data = responses
        .filter((item) => item.message)
        .map(function (item) {
            return {
                'Date': item.createdAt.toISOString(),
                'Date description': moment(item.createdAt)
                    .tz('Europe/London')
                    .format('D MMMM, YYYY h:ma'),
                'Message': item.message,
            };
        });

    return parse(data);
};
