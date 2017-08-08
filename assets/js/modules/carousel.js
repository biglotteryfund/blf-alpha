'use strict';
const Siema = require('../libs/siema.min');
const appConfig = require('../../../config/content/sass.json');

const defaultPerPage = 3;

// read tablet breakpoint from CSS config
const tabletBreakpoint = parseInt(appConfig.breakpoints.tablet.replace('px', ''));

// configure carousel - screen width: num items
let carouselBreakpointConfig = { 1: 1 };
carouselBreakpointConfig[tabletBreakpoint] = defaultPerPage;

const Carousel = function (settings) {

    let carouselElm = document.querySelector(settings.selector);

    if (carouselElm && carouselElm.getAttribute('data-per-page')) {
        carouselBreakpointConfig[tabletBreakpoint] = parseInt(carouselElm.getAttribute('data-per-page'));
    }

    if (carouselElm) {
        let carousel = new Siema({
            selector: settings.selector,
            perPage: carouselBreakpointConfig || 1,
            duration: 200,
            easing: 'ease-out',
            startIndex: 0,
            draggable: false,
            loop: false
        });

        if (settings.nextSelector) {
            document.querySelector(settings.nextSelector).addEventListener('click', () => carousel.next());
        }

        if (settings.prevSelector) {
            document.querySelector(settings.prevSelector).addEventListener('click', () => carousel.prev());
        }

        return carousel;
    }
};

const init = () => {
    return new Carousel({
        selector: '.js-carousel',
        nextSelector: '.js-carousel-next',
        prevSelector: '.js-carousel-prev',
    });
};

module.exports = {
    init: init
};