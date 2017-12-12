'use strict';

const $ = require('jquery');
const fitvids = require('fitvids');

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

function initFitVids() {
    fitvids('.video-container');
}

function init() {
    initToggleMobileNav();
    initOverlays();
    initFitVids();
}

module.exports = {
    init
};
