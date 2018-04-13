'use strict';

import $ from 'jquery';
import { featureIsEnabled } from '../helpers/features';

// Materials form logic
function initLegacyForms() {
    // Handle making "other" inputs required for radio sets
    const classes = {
        radioContainer: 'js-has-radios',
        otherTrigger: 'js-other-trigger'
    };

    // We bind to the body element like this because these
    // fields are rendered by Vue and not always in the DOM
    $('body').on('click', `.${classes.radioContainer} input[type="radio"]`, function() {
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
}

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

function handleAbandonmentMessage(formEl) {
    const abandonmentMessage = formEl.getAttribute('data-abandonment-message');

    function handleBeforeUnload(e) {
        // Message cannot be customised in Chrome 51+
        // https://developers.google.com/web/updates/2016/04/chrome-51-deprecations?hl=en
        var confirmationMessage = abandonmentMessage;
        e.returnValue = confirmationMessage; // Gecko, Trident, Chrome 34-51
        return confirmationMessage; // Gecko, WebKit, Chrome <34
    }

    if (featureIsEnabled('review-abandonment-message') && abandonmentMessage) {
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Remove beforeunload if clicking on edit links
        $('.js-application-form-review-edit').on('click', () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        });

        // Remove beforeunload if submitting the form
        formEl.addEventListener('submit', () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        });
    }
}

function initApplicationForms() {
    /**
     * Global application form logic
     */
    const formEl = $('.js-application-form');
    if (formEl.length > 0) {
        const conditionalFields = $('.js-conditional-for');
        conditionalFields.each(function() {
            const $el = $(this);
            const conditionalType = $el.data('conditionalType');
            if (conditionalType === 'radio') {
                conditionalRadios($el);
            }
        });
    }

    /**
     * Review–step–specific logic
     */
    const formReviewEl = document.querySelector('.js-application-form-review');
    if (formReviewEl) {
        handleAbandonmentMessage(formReviewEl);
    }
}

function init() {
    initLegacyForms();
    initApplicationForms();
}

export default {
    init
};
