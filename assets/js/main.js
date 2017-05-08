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

carousel.init({
    selector: '.js-carousel',
    perPage: carouselBreakpointConfig,
    nextSelector: '.js-carousel-next',
    prevSelector: '.js-carousel-prev',
});

router.get('/funding/funding-guidance/managing-your-funding/ordering-free-materials', () => {
    $('.js-order-material-btn').on('click', function (e) {
        e.preventDefault();
        const $form = $(this).parents('form');
        let data = $form.serialize();
        data += '&quantity=' + $(this).val();
        $.ajax({
            type: "POST",
            data: data,
            dataType: 'json',
            success: (response) => {
                $form.find('.js-material-count').val(response.data);
                console.log(response);
            }
        });
    });
});