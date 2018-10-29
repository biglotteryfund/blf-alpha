import $ from 'jquery';
import fitvids from 'fitvids';

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

export default {
    init
};
