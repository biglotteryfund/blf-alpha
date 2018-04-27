const $ = require('jquery');
const fitvids = require('fitvids');
const { isDownloadLink, isExternalLink } = require('../helpers/urls');
const { toggleNav } = require('../helpers/display');

function initToggleMobileNav() {
    // bind mobile nav show/hidew button
    $('#js-mobile-nav-toggle').on('click', function(e) {
        e.preventDefault();
        toggleNav();
    });
}

function initFitVids() {
    fitvids('.video-container');
}

function initContentTweaks() {
    const $contentArea = $('.js-annotate-links');
    $contentArea.find('a').each((idx, el) => {
        if (isDownloadLink(el.href)) {
            $(el).addClass('is-download-link');
        } else if (isExternalLink(location.hostname, el.hostname)) {
            $(el).addClass('is-external-link');
        }
    });
}

function init() {
    initToggleMobileNav();
    initFitVids();
    initContentTweaks();
}

module.exports = {
    init
};
