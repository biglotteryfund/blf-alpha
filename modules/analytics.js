/**
 * Server-side Google Analytics using the Measurement Protocol
 * @link https://developers.google.com/analytics/devguides/collection/protocol/v1/reference
 */
const config = require('config');
const rp = require('request-promise-native');
const uuidv4 = require('uuid/v4');
const { getFullUrl } = require('./urls');

const gaCode = config.get('googleAnalyticsCode');

function sendPayload(data) {
    const payload = Object.assign(
        {},
        {
            v: 1,
            tid: gaCode,
            cid: uuidv4()
        },
        data
    );

    return rp({
        uri: 'https://www.google-analytics.com/collect',
        method: 'POST',
        form: payload
    });
}

function customEvent(category, action, label) {
    const payload = {
        t: 'event',
        ec: category,
        ea: action
    };

    if (label) {
        payload.el = label;
    }

    return sendPayload(payload);
}

function trackPageview(req) {
    return sendPayload({
        t: 'pageview',
        dl: getFullUrl(req)
    });
}

module.exports = {
    customEvent,
    trackPageview
};
