import $ from 'jquery';
import forEach from 'lodash/forEach';
import debounce from 'lodash/debounce';
import { trackEvent, tagHotjarRecording } from '../helpers/metrics';

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

function handleSessionExpiration() {
    let sessionInterval;
    let isAuthenticated = true;
    let expiryTimeRemaining = window.AppConfig.sessionExpirySeconds;
    const expiryCheckIntervalSeconds = 5;

    function startSessionExpiryWarningTimer() {
        sessionInterval = window.setInterval(
            sessionTimeoutCheck,
            expiryCheckIntervalSeconds * 1000
        );
    }

    function clearSessionExpiryWarningTimer() {
        window.clearInterval(sessionInterval);
    }

    function closeModals() {
        $('body').removeClass('is-modal');
        $('.js-modal, .js-modal__item').hide();
    }

    function showModal(id) {
        closeModals();
        $('body').addClass('is-modal');
        $(`.js-modal, .js-modal--${id}`).show();
    }

    $('.js-close-modal').click(closeModals);

    function sessionTimeoutCheck() {
        expiryTimeRemaining = expiryTimeRemaining - expiryCheckIntervalSeconds;
        console.log(
            'There are ' +
                expiryTimeRemaining +
                ' seconds left until your session expires'
        );
        if (expiryTimeRemaining <= 0) {
            isAuthenticated = false;
            clearSessionExpiryWarningTimer();
            showModal('session-timeout');
        } else if (expiryTimeRemaining <= 10) {
            showModal('session-about-to-expire');
        }
    }

    const handleActivity = () => {
        if (isAuthenticated) {
            // Extend their session
            $.ajax({
                type: 'get',
                url: '/user/session',
                dataType: 'json'
            }).then(response => {
                // Reset the timeout clock
                expiryTimeRemaining = window.AppConfig.sessionExpirySeconds;
                isAuthenticated = response.isAuthenticated;
                clearSessionExpiryWarningTimer();
                startSessionExpiryWarningTimer();
                console.log('Activity made - clock reset!');
            });
        } else {
            showModal('session-timeout');
        }
    };

    startSessionExpiryWarningTimer();

    $('body').on('click keypress', debounce(handleActivity, 1000));
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

    // Hotjar tagging
    initHotjarTracking('awards-for-all');

    const pageHasSessionForm = $('form.js-session-form').length !== 0;
    if (pageHasSessionForm) {
        handleSessionExpiration();
    }
}

export default {
    init
};
