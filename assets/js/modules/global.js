const $ = require('jquery');
const fitvids = require('fitvids');

function init() {
    // Mobile navigation toggle
    $('#js-mobile-nav-toggle').on('click', function(e) {
        e.preventDefault();
        $('html').toggleClass('show-off-canvas');
    });

    // Fitvids
    fitvids('.video-container');
}

module.exports = {
    init
};
