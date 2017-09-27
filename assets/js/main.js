/* global $, ga, cxApi, _BLF */
'use strict';

// initialise router (eg. run conditional code for certain URLs)
const Grapnel = require('./libs/grapnel');
const router = new Grapnel({ pushState : true });

// initialise Vue
const Vue = require('../../node_modules/vue/dist/vue.common');
Vue.options.delimiters = ['<%', '%>'];

// load internal modules
require('./modules/carousel').init();
require('./modules/tabs').init();
const analytics = require('./modules/analytics');
const utils = require('./utils');

// enable JS-only features
const $html = $('html');
$html.toggleClass('no-js js-on');

// grab main script element (for querying data attributes)
const $thisScript = $('#js-script-main');

// detect IE to fix broken images (IE resizes our logo badly)
if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
    $html.addClass('is-ie');
}

// bind mobile nav show/hidew button
$('#js-mobile-nav-toggle').on('click', function (e) {
    e.preventDefault();
    $html.toggleClass('show-off-canvas');
});

// look up a cookie's value
const getCookieValue = (a) => {
    let b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
};

// toggle contrast mode (we do this in JS to avoid breaking caching)
const isHighContrast = getCookieValue('contrastMode'); // @TODO get from config
if (isHighContrast === 'high') {
    $html.addClass('contrast--high');
    $('#js-contrast-standard').show();
    $('#js-contrast-high').hide();
} else {
    $('#js-contrast-standard').hide();
    $('#js-contrast-high').show();
}

// show/hide overlay pane
$('#js-close-overlay').on('click', () => {
    $('#js-overlay').hide();
});

// if the env is PRODUCTION then we only load analytics
// if the page's domain name matches our live domain

// setup google analytics
if (!_BLF.blockAnalytics) { // set in main.njk

    // get per-environment GA code
    const uaCode = $thisScript.data('ga-code');

    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments);
        }, i[r].l = 1 * new Date();
        a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

    // init GA
    ga('create', uaCode, {
        'cookieDomain': 'none'
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
    $('.js-track-clicks').on('click', function (e) {

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
        } else { // not a link, just track it
            track();
        }
    });

}

// create Vue element for order form
// we use a regex for this URL to allow welsh URLs to match too
let fundingPagePath = /\/funding\/funding-guidance\/managing-your-funding\/ordering-free-materials/;
router.get(fundingPagePath, () => {

    let allOrderData = {};
    let langParam = 'lang';
    let isValidLangParam = (param) => ['monolingual', 'bilingual'].indexOf(param) !== -1;

    new Vue({
        el: '#js-vue',
        data: {
            orderData: allOrderData,
            itemLanguage: null
        },
        created: function () {
            let params = utils.parseQueryString();
            if (params[langParam] && isValidLangParam(params[langParam])) {
                this.itemLanguage = params[langParam];
            }
        },
        methods: {
            toggleItemLanguage: function (newState) {
                if (isValidLangParam(newState)) {
                    this.itemLanguage = newState;
                    if (history.replaceState) {
                        history.replaceState(null, null, `?${langParam}=${newState}`);
                    }
                }
            },
            getQuantity: function (code, valueAtPageload) {
                if (this.orderData[code]) {
                    return this.orderData[code].quantity;
                } else {
                    return valueAtPageload;
                }
            },
            isEmpty: function () {
                let quantity = 0;
                for (let o in this.orderData) {
                    quantity += this.orderData[o].quantity;
                }
                return (quantity === 0);
            },
            changeQuantity: function (e) {
                // this is a bit ugly: use jquery to make AJAX call
                // @TODO refactor this and commit fully to vue!
                let $elm = $(e.currentTarget);
                const $form = $elm.parents('form');
                const url = $form.attr('action');
                let data = $form.serialize();
                data += '&action=' + $elm.val();
                $.ajax({
                    url: url,
                    type: "POST",
                    data: data,
                    dataType: 'json',
                    success: (response) => {
                        allOrderData = response.allOrders;
                        this.orderData = Object.assign({}, this.orderData, response.allOrders);
                    }
                });
            }
        }
    });

});

// on the logo page we need to show a download message when the user clicks a logo
let logoPagePath = /\/funding\/funding-guidance\/managing-your-funding\/grant-acknowledgement-and-logos\/logodownloads/;
router.get(logoPagePath, () => {

    $('.js-logo-trigger').on('click', function () {
        let logoId = $(this).data('logo-id');
        let successBlock = $('#js-download-block--' + logoId);
        let logoType = $(this).data('logo-type');
        let successMessage = $('.js-success--' + logoType, successBlock);
        if (successBlock.length && successMessage.length) {
            successBlock.show(); // show parent block
            successMessage.show(); // show message
        }
    });

    $('.js-success--close').on('click', function () {
        let logoId = $(this).data('logo-id');
        let successBlock = $('#js-download-block--' + logoId);
        if (successBlock.length) {
            successBlock.find('.js-success').hide(); // hide old messages
            successBlock.hide();
        }
    });

});