'use strict';
const got = require('got');
const { DOTDIGITAL_API } = require('./secrets');

/**
 * Subscribe to a dotmailer address book
 * @param {object} options
 * @param {string} options.addressBookId
 * @param {object} options.subscriptionData
 * @see https://developer.dotmailer.com/docs
 * @see https://developer.dotmailer.com/docs/error-response-types
 */
function subscribe({ addressBookId, subscriptionData }) {
    const ENDPOINT = `https://r1-api.dotmailer.com/v2/address-books/${addressBookId}/contacts`;

    // Node bug: URL encoding with an @ sign breaks auth
    // so we construct our own header here
    // @Source: https://github.com/sindresorhus/got/issues/1169#issuecomment-617605562
    const headers = {
        "Authorization": "Basic " + Buffer.from(`${DOTDIGITAL_API.user}:${DOTDIGITAL_API.password}`).toString("base64")
    };
    return got.post(ENDPOINT, {
        json: subscriptionData,
        headers: headers
    }).json();
}


module.exports = {
    subscribe
};
