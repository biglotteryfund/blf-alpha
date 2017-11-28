'use strict';

const $ = require('jquery');

function initToggleMobileNav() {
    // bind mobile nav show/hidew button
    const $html = $('html');
    $('#js-mobile-nav-toggle').on('click', function(e) {
        e.preventDefault();
        $html.toggleClass('show-off-canvas');
    });
}

function initOverlays() {
    // show/hide overlay pane
    $('#js-close-overlay').on('click', () => {
        $('#js-overlay').hide();
    });
}

function init() {
    initToggleMobileNav();
    initOverlays();
}

module.exports = {
    init
};
