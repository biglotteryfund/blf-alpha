'use strict';
const got = require('got');
const { DOTDIGITAL_API } = require('../../../common/secrets');

/**
 * Subscribe to a dotmailer address book
 * @param {object} options
 * @param {string} options.addressBookId
 * @param {object} options.subscriptionData
 * @see https://developer.dotmailer.com/docs
 * @see https://developer.dotmailer.com/docs/error-response-types
 */
function subscribe({
    addressBookId,
    subscriptionData,
    contactType = 'contact',
}) {
    const ENDPOINT = `https://r1-api.dotmailer.com/v2/address-books/${addressBookId}/contacts`;

    const data = {
        email: subscriptionData.email,
        emailType: 'Html',
        dataFields: [
            { key: 'FirstName', value: subscriptionData.firstName },
            { key: 'LastName', value: subscriptionData.lastName },
        ],
    };

    data.dataFields.push(
        {
            key: 'COUNTRY',
            value: subscriptionData.location,
        });

    if (contactType === 'insights') {
        data.dataFields.push(
            {
                key: 'JOBTITLE',
                value: subscriptionData.jobTitle,
            },
            {
                key: 'SECTOR',
                value: subscriptionData.sector,
            }
        );
    }

    // Node bug: URL encoding with an @ sign breaks auth
    // so we construct our own header here
    // @Source: https://github.com/sindresorhus/got/issues/1169#issuecomment-617605562
    const headers = {
        Authorization:
            'Basic ' +
            Buffer.from(
                `${DOTDIGITAL_API.user}:${DOTDIGITAL_API.password}`
            ).toString('base64'),
    };
    return got
        .post(ENDPOINT, {
            json: data,
            headers: headers,
        })
        .json();
}

module.exports = {
    subscribe,
};
