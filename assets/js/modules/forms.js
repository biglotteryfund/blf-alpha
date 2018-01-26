/* global Vue */
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

    // Handle making "other" inputs required for radio sets
    const classes = {
        radioContainer: 'js-has-radios',
        otherTrigger: 'js-other-trigger'
    };

    // We bind to the body element like this because these
    // fields are rendered by Vue and not always in the DOM
    $('body').on('click', `.${classes.radioContainer} input[type="radio"]`, function (e) {
        const $clickedRadio = $(this);
        // find the corresponding <input> field for this radio set
        const $other = $('#' + $clickedRadio.parents(`.${classes.radioContainer}`).data('other-id'));
        if ($other.length === 0) {
            return;
        }
        // is the clicked element an "other" trigger?
        if ($clickedRadio.hasClass(classes.otherTrigger)) {
            $other.attr('required', true);
        } else {
            // they clicked on one of the regular radio options
            $other.attr('required', false);
        }
    });

    // application form-specific code
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
