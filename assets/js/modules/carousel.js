'use strict';

function init() {
    const carouselElems = document.querySelectorAll('.js-carousel');
    if (carouselElems.length > 0) {
        const carouselSplit = () => import('./carousel.split');
        carouselSplit().then(carousel => {
            console.log('Hello Carousel', carouselElems);

            carousel.init(carouselElems);
        });
    }
}

export default {
    init
};
