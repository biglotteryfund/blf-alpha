'use strict';

const $ = require('jquery');

function findSuccessBlock($el) {
    const logoId = $el.data('logo-id');
    const successBlock = $('#js-download-block--' + logoId);
    return successBlock;
}

function init() {
    const logoTriggerEl = $('.js-logo-trigger');
    if (logoTriggerEl.length < 1) {
        return;
    }

    logoTriggerEl.on('click', function() {
        const successBlock = findSuccessBlock($(this));
        const logoType = $(this).data('logo-type');
        const successMessage = $('.js-success--' + logoType, successBlock);
        if (successBlock.length && successMessage.length) {
            successBlock.show(); // show parent block
            successMessage.show(); // show message
        }
    });

    $('.js-success--close').on('click', function() {
        const successBlock = findSuccessBlock($(this));
        if (successBlock.length) {
            successBlock.find('.js-success').hide(); // hide old messages
            successBlock.hide();
        }
    });
}

module.exports = {
    init
};
