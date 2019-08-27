'use strict';
import $ from 'jquery';
import debounce from 'lodash/debounce';
import modal from './modal';
import { trackEvent } from '../helpers/metrics';

// Deploy switch - allows us to roll out this feature in phases
const showModals = false;

const expiryCheckIntervalSeconds = 30; // The interval we'll check timeouts in
const warningShownSecondsRemaining = 5 * 60; // The time before logout we'll show a warning at

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
            if (showModals) {
                modal.showModal('session-timeout');
            } else {
                trackEvent('Session', 'Warning', 'Timeout reached');
            }
        } else if (expiryTimeRemaining <= warningShownSecondsRemaining) {
            // The user has a few minutes remaining before logout
            if (showModals) {
                modal.showModal('session-about-to-expire');
            } else {
                trackEvent('Session', 'Warning', 'Timeout almost reached');
            }
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
            });
        } else {
            if (showModals) {
                modal.showModal('session-timeout');
            }
        }
    };

    // Start the first pageload timer counting
    startSessionExpiryWarningTimer();

    // Reset cookie expiry on these page events
    $('body').on('click keypress', debounce(handleActivity, 1000));
}

function init() {
    const pageHasSessionForm = $('form.js-session-form').length !== 0;
    if (pageHasSessionForm) {
        handleSessionExpiration();
    }
}

export default {
    init
};
