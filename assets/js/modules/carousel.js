'use strict';
const Swiper = require('swiper');
const appConfig = require('../../../config/content/sass.json');
const analytics = require('./analytics');

// read tablet breakpoint from CSS config
const tabletBreakpoint = parseInt(appConfig.breakpoints.tablet.replace('px', ''));
const defaultPerPage = 3;

const Carousel = settings => {
    const carouselElm = document.querySelector(settings.selector);

    if (carouselElm) {
        const dataName = carouselElm.getAttribute('data-name');

        let slidesToShow = defaultPerPage;
        if (carouselElm && carouselElm.getAttribute('data-per-page')) {
            slidesToShow = parseInt(carouselElm.getAttribute('data-per-page'));
        }

        // at less than tablet breakpoint, only show 1 slide
        let breakpoints = {};
        breakpoints[tabletBreakpoint] = {
            slidesPerView: 1
        };

        const carouselSwiper = new Swiper(settings.selector, {
            nextButton: settings.nextSelector,
            prevButton: settings.prevSelector,
            speed: 400,
            autoHeight: true,
            a11y: true,
            loop: true,
            slidesPerView: slidesToShow,
            breakpoints: breakpoints
        });

        carouselSwiper.on('slideChangeEnd', function(swiperInstance) {
            const idx = swiperInstance.realIndex + 1;
            if (dataName) {
                analytics.track(dataName, 'Changed slide', 'Changed to item ' + idx);
            }
        });
    }
};

const init = () => {
    return new Carousel({
        selector: '.js-carousel',
        nextSelector: '.js-carousel-next',
        prevSelector: '.js-carousel-prev'
    });
};

module.exports = {
    init: init
};
