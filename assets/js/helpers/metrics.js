/* global ga, hj */

/**
 * Track event
 * Helper to track a custom event in analytics
 */
export function trackEvent(category, action, label) {
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

/**
 * Tag recording
 * Helper to add tag(s) to the current session's Hotjar recording
 */
export function tagHotjarRecording(tags) {
    if (window.hj) {
        hj('tagRecording', tags);
    }
}
