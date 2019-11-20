import $ from 'jquery';
import debounce from 'lodash/debounce';

import { trackEvent } from '../helpers/metrics';
import modal from './modal';

// The interval we'll check timeouts in
const expiryCheckIntervalSeconds = 30;

// The time before logout we'll show a warning at
// Note: if changing this, the accompanying copy will need to change too
const warningShownSecondsRemaining = 10 * 60;

const showWarnings = window.AppConfig.apply.enableSessionExpiryWarning;

function handleSessionExpiration() {
    let sessionInterval;
    let isAuthenticated = true;
    let expiryTimeRemaining = window.AppConfig.sessionExpirySeconds;

    function startSessionExpiryWarningTimer() {
        sessionInterval = window.setInterval(
            sessionTimeoutCheck,
            expiryCheckIntervalSeconds * 1000
        );
    }

    function clearSessionExpiryWarningTimer() {
        window.clearInterval(sessionInterval);
    }

    function sessionTimeoutCheck() {
        expiryTimeRemaining = expiryTimeRemaining - expiryCheckIntervalSeconds;
        if (expiryTimeRemaining <= 0) {
            // The user's cookie has expired
            isAuthenticated = false;
            clearSessionExpiryWarningTimer();
            trackEvent('Session', 'Warning', 'Timeout reached');
            if (showWarnings) {
                modal.triggerModal('apply-expiry-expired');
            }
        } else if (expiryTimeRemaining <= warningShownSecondsRemaining) {
            // The user has a few minutes remaining before logout
            trackEvent('Session', 'Warning', 'Timeout almost reached');
            if (showWarnings) {
                modal.triggerModal('apply-expiry-pending');
            }
        }
    }

    const handleActivity = () => {
        if (isAuthenticated) {
            // Extend their session
            getUserSession().then(response => {
                // Reset the timeout clock
                expiryTimeRemaining = window.AppConfig.sessionExpirySeconds;
                isAuthenticated = response.isAuthenticated;
                clearSessionExpiryWarningTimer();
                startSessionExpiryWarningTimer();
            });
        }
    };

    // Start the first pageload timer counting
    startSessionExpiryWarningTimer();

    // Reset cookie expiry on these page events
    $('body').on('click keypress', debounce(handleActivity, 1000));
}

function getUserSession() {
    return $.ajax({
        type: 'get',
        url: '/user/session',
        dataType: 'json'
    });
}

function init() {
    const pageHasSessionForm = $('.js-session-expiry-warning').length !== 0;
    if (pageHasSessionForm) {
        handleSessionExpiration();
    }
}

export default {
    init,
    getUserSession
};
