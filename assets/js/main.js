'use strict';
/* global $ */
const appConfig = require('../../config/sass.json');
const carousel = require('./modules/carousel');
const Grapnel = require('./libs/grapnel');
const router = new Grapnel({ pushState : true });
require('./modules/data.map');

// read tablet breakpoint from CSS config
const tabletBreakpoint = parseInt(appConfig.breakpoints.tablet.replace('px', ''));
// configure carousel - screen width: num items
let carouselBreakpointConfig = { 1: 1 };
carouselBreakpointConfig[tabletBreakpoint] = 3;

// detect IE to fix broken images
if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
    $('html').addClass('is-ie');
}

carousel.init({
    selector: '.js-carousel',
    perPage: carouselBreakpointConfig,
    nextSelector: '.js-carousel-next',
    prevSelector: '.js-carousel-prev',
});

const $mobileNavToggle = document.getElementById('js-mobile-nav-toggle');
$mobileNavToggle.addEventListener('click', () => {
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

// router.get('/funding/funding-guidance/managing-your-funding/ordering-free-materials', () => {
router.get('/funding/test', () => {
    $('.js-order-material-btn').on('click', function (e) {
        e.preventDefault();
        const $form = $(this).parents('form');
        const url = $form.attr('action');
        let data = $form.serialize();
        data += '&action=' + $(this).val();
        $.ajax({
            url: url,
            type: "POST",
            data: data,
            dataType: 'json',
            success: (response) => {
                $form.find('.js-material-count').val(response.quantity);
            }
        });
    });
});