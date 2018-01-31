'use strict';

const $ = require('jquery');
const fitvids = require('fitvids');
const { isDownloadLink, isExternalLink } = require('../helpers/urls');

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

function initContentTweaks() {
    const $contentArea = $('.s-prose');
    $contentArea.find('a').each((idx, el) => {
        if (isDownloadLink(el.href)) {
            $(el).addClass('is-download-link');
        } else if (isExternalLink(el)) {
            $(el).addClass('is-external-link');
        }
    });
}

function init() {
    initToggleMobileNav();
    initOverlays();
    initFitVids();
    initContentTweaks();
}

module.exports = {
    init
};
