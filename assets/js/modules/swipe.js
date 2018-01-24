'use strict';
const Hammer = require('hammerjs');
const { toggleNav } = require('./common');

const init = () => {
    let hammertime = new Hammer(document.body, {});
    // only listen for horizontal swiping
    hammertime.get('swipe').set({ direction: Hammer.DIRECTION_HORIZONTAL });
    hammertime.on('swipe', function(ev) {
        const validSwipeDirections = [Hammer.DIRECTION_LEFT, Hammer.DIRECTION_RIGHT];
        if (validSwipeDirections.indexOf(ev.direction) !== -1) {
            toggleNav();
        }
    });
};

module.exports = {
    init: init
};
