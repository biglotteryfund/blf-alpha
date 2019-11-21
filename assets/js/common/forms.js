import $ from 'jquery';
import forEach from 'lodash/forEach';
import { trackEvent, tagHotjarRecording } from '../helpers/metrics';
import session from './session';

function handleBeforeUnload(e) {
    // Message cannot be customised in Chrome 51+
    // https://developers.google.com/web/updates/2016/04/chrome-51-deprecations?hl=en
    trackEvent(
        'Apply',
        'User warned before abandoning form changes',
        'message shown'
    );
    tagHotjarRecording(['App: User shown page abandonment warning']);
    const confirmationMessage = 'Are you sure you want to leave this page?';
    e.returnValue = confirmationMessage; // Gecko, Trident, Chrome 34-51
    return confirmationMessage; // Gecko, WebKit, Chrome <34
}

function removeBeforeUnload() {
    window.removeEventListener('beforeunload', handleBeforeUnload);
}

/*
 * Warns the user before leaving a page if the form's state is different from when the page was loaded.
 *
 * Caveats: form must have the class below and the field must lose focus to trigger the change() event.
 * */
function warnOnUnsavedChanges() {
    $('.js-form-warn-unsaved').each(function() {
        const $form = $(this);

        const initialState = $form.serialize();
        const formHasErrors = $form.data('form-has-errors');

        // Remove the event binding for any of the submit buttons
        // as they all save the current progress when clicked
        $form
            .find('input[type="submit"], button[type="submit"]')
            .on('click', removeBeforeUnload);

        $(document).ready(() => {
            if (formHasErrors) {
                window.addEventListener('beforeunload', handleBeforeUnload);
            }
            $(':input', $form).change(function() {
                if ($form.serialize() !== initialState) {
                    window.addEventListener('beforeunload', handleBeforeUnload);
                } else {
                    removeBeforeUnload();
                }
            });
        });
    });
}

function handleExpandingDetails() {
    let isClosed = true;
    const $toggleBtn = $('.js-toggle-all-details');
    $toggleBtn.text($toggleBtn.data('label-closed')).show();

    $toggleBtn.on('click', function() {
        $toggleBtn.text(
            isClosed
                ? $toggleBtn.data('label-open')
                : $toggleBtn.data('label-closed')
        );
        $('details.js-toggleable').attr('open', isClosed);
        $toggleBtn.attr('aria-expanded', isClosed);
        isClosed = !isClosed;
    });
}

function handleConditionalRadios() {
    forEach(document.querySelectorAll('.js-conditional-radios'), el => {
        function setAttributes(radioEl) {
            var inputIsChecked = radioEl.checked;
            var conditionalEl = el.querySelector(
                `#${radioEl.getAttribute('aria-controls')}`
            );
            if (conditionalEl) {
                conditionalEl.setAttribute('aria-expanded', inputIsChecked);

                if (inputIsChecked) {
                    conditionalEl.removeAttribute('hidden');
                } else {
                    conditionalEl.setAttribute('hidden', 'hidden');
                }
            }
        }

        const radioEls = el.querySelectorAll('input[type="radio"]');
        forEach(radioEls, radioEl => {
            const controls = radioEl.getAttribute('data-aria-controls');
            if (controls) {
                radioEl.setAttribute('aria-controls', controls);
                radioEl.removeAttribute('data-aria-controls');
                setAttributes(radioEl);
            }
        });

        el.addEventListener('click', function() {
            forEach(radioEls, radioEl => {
                // If a radio with aria-controls, handle click
                var isRadio = radioEl.getAttribute('type') === 'radio';
                var hasAriaControls = radioEl.getAttribute('aria-controls');
                if (isRadio && hasAriaControls) {
                    setAttributes(radioEl);
                }
            });
        });
    });
}

// Track occurrences of users changing their mind about radio options
// eg. to highlight potential confusion around questions
function trackIndecisiveness($form) {
    let fields = {};
    $('input[type="radio"]', $form).on('click', function() {
        const name = $(this).attr('name');
        const value = $(this).val();
        if (!fields[name]) {
            fields[name] = value;
        } else {
            if (fields[name] !== value) {
                tagHotjarRecording([
                    'App: User changed selection on radio button'
                ]);
                fields[name] = value;
            }
        }
    });
}

// Track when a radio button is clicked that has no other options
// (eg. when a contact role choice is limited to a single item)
function trackOneOptionRadios($form) {
    $('input[type="radio"]', $form).on('click', function() {
        const name = $(this).attr('name');
        const others = $(`input[type="radio"][name="${name}"]`);
        if (others.length === 1) {
            tagHotjarRecording(['App: Only one radio option shown']);
        }
    });
}

// Track the occurrence of a warning about contacts sharing surnames
function trackSharedSurnameWarning($form, shortId) {
    if ($('.js-form-warning-surname', $form).length > 0) {
        tagHotjarRecording([
            `Apply: ${shortId}: Contacts: User contact surname match`
        ]);
    }
}

// Track clicks on details expandos
function trackDetailsClicks($form, shortId) {
    $('details summary', $form).on('click', function() {
        tagHotjarRecording([
            `Apply: ${shortId}: Summary: User toggles details element`
        ]);
    });
}

// Detect attempted form submissions and log when the browser prevents the submission
// due to inline validation failure.
function trackInvalidSubmissionAttempts($form) {
    $('[type="submit"]', $form).on('click', function() {
        const $parentForm = $(this)
            .parents('form')
            .first();
        const formIsValid = $parentForm[0].checkValidity();
        if (!formIsValid) {
            tagHotjarRecording(['App: User shown browser validation error']);
            trackEvent('Apply', 'Attempted form submit', 'Failed validation');
        }
    });
}

function initHotjarTracking() {
    $(document).ready(function() {
        $('.js-apply-form').each(function() {
            const $form = $(this);
            const shortId = $(this).data('form-short-id');
            trackInvalidSubmissionAttempts($form);
            trackIndecisiveness($form);
            trackOneOptionRadios($form);
            trackSharedSurnameWarning($form, shortId);
            trackDetailsClicks($form, shortId);
        });
    });
}

// Update the Login link to Logout if user signs in
function updateSecondaryNav() {
    session.getUserSession().then(response => {
        const $accountLink = response.isAuthenticated
            ? $('.js-toggle-logout')
            : $('.js-toggle-login');
        $accountLink.removeClass('js-hidden u-hidden');
    });
}

// Shows an error/warning if a user saves a local copy of the form
// and attempts to use it locally (which will fail)
function showLocalSaveWarning() {
    if (window.location.protocol === 'file:') {
        $('#js-form-local-save-message').show();
    }
}

function init() {
    handleConditionalRadios();
    handleExpandingDetails();
    warnOnUnsavedChanges();
    updateSecondaryNav();
    showLocalSaveWarning();

    // Hotjar tagging
    initHotjarTracking();
}

export default {
    init,
    removeBeforeUnload
};
