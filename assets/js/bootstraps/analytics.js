/* global ga, cxApi */
import $ from 'jquery';
const analytics = require('../modules/analytics');

export const init = () => {
    // grab main script element (for querying data attributes)
    const $thisScript = $('#js-script-main');

    // get per-environment GA code
    const uaCode = $thisScript.data('ga-code');

    window.ga =
        window.ga ||
        function() {
            (ga.q = ga.q || []).push(arguments);
        };
    ga.l = +new Date();

    const CUSTOM_METRICS = {
        maxScrollPercentage: {
            idx: 1,
            name: 'metric1',
            description: 'Max Scroll Percentage'
        }
    };

    // init GA
    ga('create', uaCode, {
        cookieDomain: 'none'
    });

    ga('set', 'transport', 'beacon');

    ga('require', 'maxScrollTracker', {
        maxScrollMetricIndex: CUSTOM_METRICS.maxScrollPercentage.idx
    });

    // initialise A/B tests
    let ab = {
        id: $thisScript.data('ab-id'),
        variant: $thisScript.data('ab-variant')
    };

    // if we're in a test variant, record it
    if (ab.id && ab.variant) {
        ga('set', 'expId', ab.id);
        ga('set', 'expVar', ab.variant);
        cxApi.setChosenVariation(ab.variant, ab.id);
    }

    // track this pageview
    ga('send', 'pageview');

    // track interactions with in-page elements
    $('.js-track-clicks').on('click', function(e) {
        // get metadata
        let category = $(this).data('category');
        let action = $(this).data('action');
        let label = $(this).data('label');

        let track = () => analytics.track(category, action, label);

        // is this a link?
        if ($(this).attr('href')) {
            // delay following it (so GA can track)
            e.preventDefault();
            track();
            window.setTimeout(() => {
                // now follow the link
                document.location = $(this).attr('href');
            }, 350);
        } else {
            // not a link, just track it
            track();
        }
    });
};
