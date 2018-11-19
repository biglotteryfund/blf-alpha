'use strict';
const request = require('request-promise-native');
const { PAST_GRANTS_API_URI } = require('../modules/secrets');

module.exports = {
    query(params) {
        return request({
            url: PAST_GRANTS_API_URI,
            json: true,
            qs: params
        });
    },
    getById({ id, locale }) {
        return request({
            url: `${PAST_GRANTS_API_URI}/${id}`,
            json: true,
            qs: { locale }
        });
    }
};
