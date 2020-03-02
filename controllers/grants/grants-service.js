'use strict';
const got = require('got');
const { PAST_GRANTS_API_URI } = require('../../common/secrets');

const queryPastGrants = got.extend({
    prefixUrl: PAST_GRANTS_API_URI
});

module.exports = {
    query(searchParams) {
        return queryPastGrants('', { searchParams: searchParams }).json();
    },
    getGrantById({ id, locale }) {
        return queryPastGrants(`/${id}`, { searchParams: { locale } }).json();
    },
    getRecipientById({ id, locale, page = 1 }) {
        return queryPastGrants(`/recipient/${encodeURIComponent(id)}`, {
            searchParams: { locale, page }
        }).json();
    }
};
