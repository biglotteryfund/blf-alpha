/* global ga */

function trackEvent(category, action, label) {
    if (window.ga && category && action && label) {
        ga('send', {
            hitType: 'event',
            eventCategory: category,
            eventAction: action,
            eventLabel: label
        });
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
