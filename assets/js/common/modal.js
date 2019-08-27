'use strict';
import $ from 'jquery';
const $body = $('body');

function closeModals() {
    $body.removeClass('is-modal');
    $('.js-modal, .js-modal__item').hide();
}

function showModal(id) {
    closeModals();
    $body.addClass('is-modal');
    $(`.js-modal, .js-modal--${id}`).show();
}

$('.js-close-modal').click(closeModals);

export default {
    showModal
};
