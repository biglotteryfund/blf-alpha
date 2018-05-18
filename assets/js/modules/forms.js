import $ from 'jquery';
import { featureIsEnabled } from '../helpers/features';
const { trackEvent } = require('../helpers/metrics');

function handleAbandonmentMessage(formEl) {
    if (!featureIsEnabled('review-abandonment-message')) {
        return;
    }

    let recordUnload = true;

    function handleBeforeUnload(e) {
        // Message cannot be customised in Chrome 51+
        // https://developers.google.com/web/updates/2016/04/chrome-51-deprecations?hl=en
        trackEvent('Apply', 'Review step abandonment check', 'message shown');
        var confirmationMessage = 'Are you sure you want to leave this page?';
        e.returnValue = confirmationMessage; // Gecko, Trident, Chrome 34-51
        return confirmationMessage; // Gecko, WebKit, Chrome <34
    }

    function removeBeforeUnload() {
        recordUnload = false;
        window.removeEventListener('beforeunload', handleBeforeUnload);
    }

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Remove beforeunload if clicking on edit links
    $('.js-application-form-review-link').on('click', removeBeforeUnload);

    // Remove beforeunload if submitting the form
    formEl.addEventListener('submit', removeBeforeUnload);

    window.addEventListener('unload', function() {
        recordUnload && trackEvent('Apply', 'Review step abandonment check', 'left page');
    });
}

function conditionalRadios($el) {
    $('body').on('change', `#${$el.get(0).id} input[type="radio"]`, function(e) {
        const $targetEl = $(e.target);
        const selectedValue = $targetEl.val();
        const conditionalFields = $el.data('conditionalFields');
        conditionalFields.forEach(field => {
            const $triggerField = $(`[data-conditional-field="${field.triggerField}"]`);
            $triggerField.attr('hidden', function() {
                return selectedValue !== field.triggerOnValue;
            });
        });
    });
}

function init() {
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

export default {
    init
};
