'use strict';
/* global $, ga, cxApi */
const carousel = require('./modules/carousel');
const Grapnel = require('./libs/grapnel');
const router = new Grapnel({ pushState : true });

// load modules
require('./modules/data.map');
require('./modules/tabs').init();

const $thisScript = document.getElementById('js-script-main');

// initialise Vue
const Vue = require('./libs/vue');
Vue.options.delimiters = ['<%', '%>'];

$('html').toggleClass('no-js js-on');

// detect IE to fix broken images
if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
    $('html').addClass('is-ie');
}

carousel.init({
    selector: '.js-carousel',
    nextSelector: '.js-carousel-next',
    prevSelector: '.js-carousel-prev',
});

const $mobileNavToggle = document.getElementById('js-mobile-nav-toggle');
$mobileNavToggle.addEventListener('click', (e) => {
    e.preventDefault();
    document.documentElement.classList.toggle('show-off-canvas');
});

const getCookieValue = function (a) {
    let b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
};

const isHighContrast = getCookieValue('contrastMode'); // @TODO get from config
if (isHighContrast === 'high') {
    $('html').addClass('contrast--high');
    $('#js-contrast-standard').show();
    $('#js-contrast-high').hide();
} else {
    $('#js-contrast-standard').hide();
    $('#js-contrast-high').show();
}

$('#js-close-overlay').on('click', () => {
    $('#js-overlay').hide();
});

// setup google analytics
const uaCode = $thisScript.getAttribute('data-ga-code');
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments);},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m);
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
ga('create', uaCode, {
    'cookieDomain': 'none'
});

let ab = {
    id: $thisScript.getAttribute('data-ab-id'),
    variant: $thisScript.getAttribute('data-ab-variant')
};

if (ab.id && ab.variant) {
    console.log('tracking test', ab);
    ga('set', 'expId', ab.id);
    ga('set', 'expVar', ab.variant);
    cxApi.setChosenVariation(ab.variant, ab.id);
}

ga('send', 'pageview');

let fundingRegex = /\/funding\/funding-guidance\/managing-your-funding\/ordering-free-materials|\/funding\/test/;
router.get(fundingRegex, () => {

    let allOrderData = {};

    new Vue({
        el: '#js-vue',
        data: {
            orderData: allOrderData,
            showMonolingual: null
        },
        methods: {
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