const $ = require('jquery');
const fitvids = require('fitvids');

function initNavToggle() {
    // Mobile navigation toggle
    $('#js-mobile-nav-toggle').on('click', function(e) {
        e.preventDefault();
        $('html').toggleClass('show-off-canvas');
    });
}

function initGlobalHeaderNext() {
    const stateClassNames = {
        nav: 'has-toggled-navigation',
        search: 'has-toggled-search'
    };

    const $html = $('html');
    const $el = $('.js-global-header');
    if ($el.length === 0) {
        return;
    }

    const $toggleNav = $el.find('.js-toggle-nav');
    const $toggleSearch = $el.find('.js-toggle-search');

    $('body').on('click', function(e) {
        const outsideClick = $(e.target).closest($el).length === 0;
        if (outsideClick && ($html.hasClass(stateClassNames.search) || $html.hasClass(stateClassNames.nav))) {
            $html.removeClass(stateClassNames.search);
            $html.removeClass(stateClassNames.nav);
        }
    });

    $toggleNav.on('click', function(e) {
        e.preventDefault();
        $html.removeClass(stateClassNames.search);
        $html.toggleClass(stateClassNames.nav);
    });

    $toggleSearch.on('click', function(e) {
        e.preventDefault();
        $html.removeClass(stateClassNames.nav);
        $html.toggleClass(stateClassNames.search);
        $el.find('input[type=search]').focus();
    });
}

function init() {
    initNavToggle();
    initGlobalHeaderNext();
    fitvids('.video-container');
}

module.exports = {
    init
};
