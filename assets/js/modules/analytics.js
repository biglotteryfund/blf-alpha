/* global ga */

let track = (category, action, label) => {
    if (window.ga && category && action && label) {
        ga('send', {
            hitType: 'event',
            eventCategory: category,
            eventAction: action,
            eventLabel: label
        });
    }
};

let setPageView = (path) => {
    if (window.ga && path) {
        ga('set', 'page', path);
        ga('send', 'pageview');
    }
};

module.exports = {
    track: track,
    setPageView: setPageView
};