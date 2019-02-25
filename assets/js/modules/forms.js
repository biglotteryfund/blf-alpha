import $ from 'jquery';
import { trackEvent } from '../helpers/metrics';

function handleAbandonmentMessage(formEl) {
    let recordUnload = true;
    function handleBeforeUnload(e) {
        // Message cannot be customised in Chrome 51+
        // https://developers.google.com/web/updates/2016/04/chrome-51-deprecations?hl=en
        trackEvent('Apply', 'Review step abandonment check', 'message shown');
        const confirmationMessage = 'Are you sure you want to leave this page?';
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

function toggleReviewAnswers() {
    $('.js-toggle-answer').each(function() {
        const $el = $(this);
        const $toggle = $el.find('button');
        const $toggleLabel = $toggle.find('.js-toggle-answer-label');
        $toggle.on('click', function() {
            $el.toggleClass('is-active');
            const originalText = $toggleLabel.text();
            $toggleLabel.text($toggleLabel.data('toggleLabel'));
            $toggleLabel.data('toggleLabel', originalText);
        });
    });
}

function handleExpandingDetails() {
    let isClosed = true;
    const $toggleBtn = $('.js-toggle-all-details');
    $toggleBtn.text($toggleBtn.data('label-closed')).show();

    $toggleBtn.on('click', function() {
        $toggleBtn.text(isClosed ? $toggleBtn.data('label-open') : $toggleBtn.data('label-closed'));
        $('details').attr('open', isClosed);
        isClosed = !isClosed;
    });
}

function init() {
    /**
     * Review–step–specific logic
     */
    const formReviewEl = document.querySelector('.js-application-form-review');
    if (formReviewEl) {
        handleAbandonmentMessage(formReviewEl);
        toggleReviewAnswers();
    }
    handleExpandingDetails();
}

export default {
    init
};
