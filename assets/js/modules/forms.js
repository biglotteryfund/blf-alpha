'use strict';

const $ = require('jquery');

function conditionalRadios($el) {
    const $radios = $el.find('input[type="radio"]');
    const conditionalFields = $el.data('conditionalFields');
    $radios.on('change', function() {
        const selectedValue = $(this).val();
        conditionalFields.forEach(field => {
            const $triggerField = $(`[data-conditional-field="${field.triggerField}"]`);
            $triggerField.attr('hidden', function() {
                return selectedValue !== field.triggerOnValue;
            });
        });
    });
}

function init() {
    const formEl = $('.js-application-form');
    if (formEl.length === 0) {
        return;
    }

    const conditionalFields = $('.js-conditional-for');
    conditionalFields.each(function() {
        const $el = $(this);
        const conditionalType = $el.data('conditionalType');
        if (conditionalType === 'radio') {
            conditionalRadios($el);
        }
    });
}

module.exports = {
    init: init
};
