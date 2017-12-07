const uuidv4 = require('uuid/v4');
const config = require('config');
const rp = require('request-promise-native');

const track = (category, action, label) => {
    if (category && action) {
        let payload = {
            v: 1,
            t: 'event',
            tid: config.get('googleAnalyticsCode'),
            cid: uuidv4(),
            ec: category,
            ea: action
        };

        if (label) {
            payload.el = label;
        }

        return rp({
            uri: 'https://www.google-analytics.com/collect',
            method: 'POST',
            form: payload
        });
    }
};

module.exports = {
    track
};
