'use strict';
const Swiper = require('swiper');
const { forEach } = require('lodash');
const { trackEvent } = require('../helpers/metrics');

function init() {
    const carouselElems = document.querySelectorAll('.js-carousel');
    if (carouselElems.length > 0) {
        forEach(carouselElems, carouselElem => {
            const dataName = carouselElem.getAttribute('data-name');
            const nextEl = carouselElem.querySelector('.js-carousel-next');
            const prevEl = carouselElem.querySelector('.js-carousel-prev');

            const carouselSwiper = new Swiper(carouselElem, {
                navigation: {
                    next: nextEl,
                    prev: prevEl
                },
                speed: 300,
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

            carouselSwiper.init();
        });
    }
}

module.exports = {
    init: init
};
