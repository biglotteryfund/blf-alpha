'use strict';
const Swiper = require('../libs/swiper.jquery.min');
const appConfig = require('../../../config/content/sass.json');

// read tablet breakpoint from CSS config
const tabletBreakpoint = parseInt(appConfig.breakpoints.tablet.replace('px', ''));
const defaultPerPage = 3;

const Carousel = (settings) => {

    let carouselElm = document.querySelector(settings.selector);

    if (carouselElm) {

        let slidesToShow = defaultPerPage;
        if (carouselElm && carouselElm.getAttribute('data-per-page')) {
            slidesToShow = parseInt(carouselElm.getAttribute('data-per-page'));
        }

        // at less than tablet breakpoint, only show 1 slide
        let breakpoints = {};
        breakpoints[tabletBreakpoint] = {
            slidesPerView: 1
        };

        return new Swiper(settings.selector, {
            nextButton: settings.nextSelector,
            prevButton: settings.prevSelector,
            speed: 400,
            autoHeight: true,
            a11y: true,
            loop: true,
            slidesPerView: slidesToShow,
            breakpoints: breakpoints
        });
    }
};

const init = () => {
    return new Carousel({
        selector: '.swiper-container',
        nextSelector: '.js-carousel-next',
        prevSelector: '.js-carousel-prev',
    });
};

module.exports = {
    init: init
};