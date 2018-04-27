function init() {
    const carouselElems = document.querySelectorAll('.js-carousel');
    if (carouselElems.length > 0) {
        const carouselSplit = () => import(/* webpackChunkName: "carousel" */ './carousel.split');
        carouselSplit().then(carousel => {
            carousel.init(carouselElems);
        });
    }
}

export default {
    init
};
