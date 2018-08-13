const $ = require('jquery');
const fitvids = require('fitvids');

function initNavToggle() {
    // Mobile navigation toggle
    $('#js-mobile-nav-toggle').on('click', function(e) {
        e.preventDefault();
        $('html').toggleClass('show-off-canvas');
    });
}


function init() {
    initNavToggle();
    fitvids('.video-container');
}

module.exports = {
    init
};
