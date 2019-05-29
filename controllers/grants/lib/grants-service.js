'use strict';
const request = require('request-promise-native');
const { PAST_GRANTS_API_URI } = require('../../../common/secrets');

module.exports = {
    query(params) {
        return request({
            url: PAST_GRANTS_API_URI,
            json: true,
            qs: params
        });
    },
    getGrantById({ id, locale }) {
        return request({
            url: `${PAST_GRANTS_API_URI}/${id}`,
            json: true,
            qs: { locale }
        });
    },
    getRecipientById({ id, locale, page = 1 }) {
        return request({
            url: `${PAST_GRANTS_API_URI}/recipient/${encodeURIComponent(id)}`,
            json: true,
            qs: { locale, page }
        });
    }
};
