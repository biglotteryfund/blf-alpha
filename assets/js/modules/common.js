'use strict';

const $ = require('jquery');

const getCookieValue = a => {
    let b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
};

function initToggleMobileNav() {
    // bind mobile nav show/hidew button
    const $html = $('html');
    $('#js-mobile-nav-toggle').on('click', function(e) {
        e.preventDefault();
        $html.toggleClass('show-off-canvas');
    });
}

function initHighContrastMode() {
    // toggle contrast mode (we do this in JS to avoid breaking caching)
    const $html = $('html');
    const isHighContrast = getCookieValue('contrastMode'); // @TODO get from config
    if (isHighContrast === 'high') {
        $html.addClass('contrast--high');
        $('#js-contrast-standard').show();
        $('#js-contrast-high').hide();
    } else {
        $('#js-contrast-standard').hide();
        $('#js-contrast-high').show();
    }
}

function initOverlays() {
    // show/hide overlay pane
    $('#js-close-overlay').on('click', () => {
        $('#js-overlay').hide();
    });
}

function init() {
    initToggleMobileNav();
    initHighContrastMode();
    initOverlays();
}

module.exports = {
    init
};
