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

function handleAbandonmentMessage(formEl) {
    let recordUnload = true;

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
        recordUnload &&
            trackEvent(
                'Apply',
                'User warned before abandoning form changes',
                'left page'
            );
    });
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

        $form.submit(function() {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        });

        $(document).ready(() => {
            if (formHasErrors) {
                window.addEventListener('beforeunload', handleBeforeUnload);
            }
            $(':input', $form).change(function() {
                if ($form.serialize() !== initialState) {
                    window.addEventListener('beforeunload', handleBeforeUnload);
                } else {
                    window.removeEventListener(
                        'beforeunload',
                        handleBeforeUnload
                    );
                }
            });
        });
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
        $toggleBtn.text(
            isClosed
                ? $toggleBtn.data('label-open')
                : $toggleBtn.data('label-closed')
        );
        $('details.js-toggleable').attr('open', isClosed);
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
function trackIndecisiveness(formClass) {
    let fields = {};
    $(`form.${formClass} input[type="radio"]`).on('click', function() {
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
function trackOneOptionRadios(formClass) {
    $(`form.${formClass} input[type="radio"]`).on('click', function() {
        const name = $(this).attr('name');
        const others = $(`input[type="radio"][name="${name}"]`);
        if (others.length === 1) {
            tagHotjarRecording(['App: Only one radio option shown']);
        }
    });
}

// Track the occurrence of a warning about contacts sharing surnames
function trackSharedSurnameWarning(formClass) {
    if ($(`form.${formClass} .js-form-warning-surname`).length > 0) {
        tagHotjarRecording([
            'Apply: AFA: Contacts: User contact surname match'
        ]);
    }
}

// Track clicks on details expandos
function trackDetailsClicks(formClass) {
    $(`.${formClass} details summary`).on('click', function() {
        tagHotjarRecording([
            'Apply: AFA: Summary: User toggles details element'
        ]);
    });
}

// Detect attempted form submissions and log when the browser prevents the submission
// due to inline validation failure.
function trackInvalidSubmissionAttempts(formClass) {
    $(`form.${formClass} input[type="submit"]`).on('click', function() {
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

function initHotjarTracking(formId) {
    const scopedFormClass = `js-apply-${formId}`;
    trackInvalidSubmissionAttempts(scopedFormClass);
    trackIndecisiveness(scopedFormClass);
    trackOneOptionRadios(scopedFormClass);
    trackSharedSurnameWarning(scopedFormClass);
    trackDetailsClicks(scopedFormClass);
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

function animateSaveButtons() {
    $('.js-save-btn-form')
        .find('input[type="submit"], button[type="submit"]')
        .on('click', function(event) {
            // Prevent previous / next buttons from triggering animations
            const targetName = $(this).attr('name');
            if (['previousBtn', 'nextBtn'].indexOf(targetName) !== -1) {
                return;
            }

            // Prevent form submission initially
            event.preventDefault();

            const $form = $(this)
                .parents('form')
                .first();
            const $btn = $form.find('.js-save-btn');
            const $label = $btn.find('.js-save-btn-label');

            // animation is 0.3s long x 3 (with a 0.3s delay, eg. 1.2 total)
            const cssDotAnimationDuration = 300 * 4;
            const cssIconAnimationDuration = 300;

            const text = {
                interstitial: $btn.data('interstitial'),
                complete: $btn.data('complete')
            };

            const classes = {
                loading: 'is-loading',
                complete: 'is-complete'
            };

            const setBtnLabel = text => {
                $label.text(text);
            };

            $btn.addClass(classes.loading);
            setBtnLabel(text.interstitial);

            window.setTimeout(function() {
                setBtnLabel(text.complete);
                $btn.addClass(classes.complete);
            }, cssDotAnimationDuration);

            window.setTimeout(function() {
                // Re-trigger the submit request
                $form.submit();
            }, cssDotAnimationDuration + cssIconAnimationDuration);
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
    handleConditionalRadios();
    handleExpandingDetails();
    warnOnUnsavedChanges();
    updateSecondaryNav();
    showLocalSaveWarning();

    // Launch this feature in non-prod envs (for now) and don't add extra delays for automated tests
    if (
        window.AppConfig.environment !== 'production' &&
        !window.AppConfig.isTestServer
    ) {
        animateSaveButtons();
    }

    // Hotjar tagging
    initHotjarTracking('awards-for-all');
}

export default {
    init
};
