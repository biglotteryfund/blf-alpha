const Siema = require('../libs/siema.min');

const init = function (settings) {

    let carousel = new Siema({
        selector: settings.selector,
        perPage: settings.perPage || 1,
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
};

module.exports = {
    init: init
};