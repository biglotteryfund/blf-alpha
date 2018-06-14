/* global ga */

function trackEvent(category, action, label) {
    if (window.ga && category && action) {
        const payload = {
            hitType: 'event',
            eventCategory: category,
            eventAction: action,
            eventLabel: label
        };

        if (label) {
            payload.eventLabel = label;
        }

        ga('send', payload);
    }
}

function setPageView(path) {
    if (window.ga && path) {
        ga('set', 'page', path);
        ga('send', 'pageview');
    }
}

module.exports = {
    trackEvent,
    setPageView
};
