'use strict';
const config = require('config');
const request = require('request-promise-native');
const debug = require('debug')('biglotteryfund:newsletter-service');
const raven = require('raven');

const metrics = require('../modules/metrics');
const { DOTMAILER_API } = require('../modules/secrets');

/**
 * Subscribe to a dotmailer address book
 * @param {object} options
 * @param {string} options.addressBookId
 * @param {object} options.subscriptionData
 * @see https://developer.dotmailer.com/docs
 * @see https://developer.dotmailer.com/docs/error-response-types
 */
function subscribe({ addressBookId, subscriptionData }) {
    const ENDPOINT = `https://apiconnector.com/v2/address-books/${addressBookId}/contacts`;

    return new Promise((resolve, reject) => {
        request({
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
        })
            .then(response => {
                if (response.statusCode === 200) {
                    debug(`Subscribed to address book: ${addressBookId}`);
                    metrics.count({
                        name: addressBookId,
                        namespace: 'SITE/NEWSLETTER',
                        dimension: 'SUBSCRIBED',
                        value: 'SUBSCRIBED_COUNT'
                    });
                    resolve(response);
                } else {
                    raven.captureMessage(response.message);
                    reject(new Error(response.message));
                }
            })
            .catch(error => {
                raven.captureMessage(error.message);
                reject(new Error(error.message));
            });
    });
}

module.exports = {
    subscribe
};
