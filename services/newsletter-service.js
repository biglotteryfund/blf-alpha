'use strict';
const config = require('config');
const request = require('request-promise-native');
const debug = require('debug')('biglotteryfund:newsletter-service');

const metrics = require('../modules/metrics');
const { DOTMAILER_API } = require('../modules/secrets');

/**
 * Subscribe to a dotmailer address book
 * @param {object} options
 * @param {string} options.addressBookId
 * @param {object} options.subscriptionData
 */
function subscribe({ addressBookId, subscriptionData }) {
    const ENDPOINT = `${config.get('ebulletinApiEndpoint')}/address-books/${addressBookId}/contacts`;
    return request({
        uri: ENDPOINT,
        method: 'POST',
        auth: {
            user: DOTMAILER_API.user,
            pass: DOTMAILER_API.password,
            sendImmediately: true
        },
        json: true,
        body: subscriptionData,
        resolveWithFullResponse: true
    }).then(response => {
        if (response.statusCode === 200) {
            debug(`Subscribed to address book: ${addressBookId}`);
            metrics.count({
                name: addressBookId,
                namespace: 'SITE/NEWSLETTER',
                dimension: 'SUBSCRIBED',
                value: 'SUBSCRIBED_COUNT'
            });
            return response;
        } else {
            throw new Error(response.message);
        }
    });
}

module.exports = {
    subscribe
};
