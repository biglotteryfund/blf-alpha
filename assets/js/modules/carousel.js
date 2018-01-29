'use strict';
const Swiper = require('swiper');
const { trackEvent } = require('../helpers/metrics');

function init() {
    const settings = {
        selector: '.js-carousel',
        nextSelector: '.js-carousel-next',
        prevSelector: '.js-carousel-prev'
    };

    const carouselElm = document.querySelector(settings.selector);

    if (carouselElm) {
        const dataName = carouselElm.getAttribute('data-name');
        const carouselSwiper = new Swiper(settings.selector, {
            nextButton: settings.nextSelector,
            prevButton: settings.prevSelector,
            speed: 400,
            autoHeight: true,
            a11y: true,
            loop: true,
            slidesPerView: 1
        });

        carouselSwiper.on('slideChangeEnd', function(swiperInstance) {
            const idx = swiperInstance.realIndex + 1;
            if (dataName) {
                trackEvent(dataName, 'Changed slide', 'Changed to item ' + idx);
            }
        });
    }
}

module.exports = {
    init: init
};
