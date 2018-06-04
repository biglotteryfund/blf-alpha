import $ from 'jquery';
import { storageAvailable } from '../helpers/storage';
const { trackEvent } = require('../helpers/metrics');

const CAN_STORE = storageAvailable('localStorage');
const KEY_NAME = 'blf.cookie-consent';

function init() {
    const $cookieWarning = $('#js-cookie-consent');
    const $acceptButton = $('#js-cookie-consent-accept');

    const hasAccepted = window.localStorage.getItem(KEY_NAME) === 'true';

    if (CAN_STORE && hasAccepted === false) {
        setTimeout(() => {
            $cookieWarning.prependTo('body').addClass('is-shown');
            $acceptButton.on('click', function() {
                window.localStorage.setItem(KEY_NAME, 'true');
                trackEvent('Cookie Warning', 'Click', 'Accept');
                $cookieWarning.removeClass('is-shown');
            });
        }, 600);
    }
}

export default {
    init
};
