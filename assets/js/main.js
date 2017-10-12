/* global ga, cxApi, _BLF */
'use strict';

const $ = require('jquery');

/**
 * Initialise Vue
 */
const Vue = require('../../node_modules/vue/dist/vue.common');
Vue.options.delimiters = ['<%', '%>'];

/**
 * Bootstraps
 */
const raven = require('./bootstraps/raven');
raven.init(Vue);

/**
 * Load modules
 */
require('./modules/common').init();
require('./modules/tabs').init();
require('./modules/carousel').init();
require('./modules/heroImages').init();
require('./modules/logos').init();
require('./modules/materials').init();

/**
 * Analytics
 * If the we are in the live environment then load analytics
 * @see main.njk for where _BLF.blockAnalytics is set
 */
const analytics = require('./modules/analytics');
if (!_BLF.blockAnalytics) {
    // grab main script element (for querying data attributes)
    const $thisScript = $('#js-script-main');

    // get per-environment GA code
    const uaCode = $thisScript.data('ga-code');

    (function(i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        (i[r] =
            i[r] ||
            function() {
                (i[r].q = i[r].q || []).push(arguments);
            }),
            (i[r].l = 1 * new Date());
        (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

    // init GA
    ga('create', uaCode, {
        cookieDomain: 'none'
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
}
