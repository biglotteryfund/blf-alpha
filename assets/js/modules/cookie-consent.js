import $ from 'jquery';
import { storageAvailable } from '../helpers/storage';
const { trackEvent } = require('../helpers/metrics');

const CAN_STORE = storageAvailable('localStorage');
const KEY_NAME = 'blf.cookie-consent';

function init() {
    const $cookieWarning = $('#js-cookie-warning');
    const $acceptButton = $('#js-accept-cookies');

    $acceptButton.on('click', function() {
        $cookieWarning.slideToggle(600, () => {
            $(this).remove();
            trackEvent('Cookie Warning', 'Click', 'Accept');
            if (CAN_STORE) {
                window.localStorage.setItem(KEY_NAME, 'true');
            }
        });
    });

    if (CAN_STORE && !window.localStorage.getItem(KEY_NAME)) {
        $cookieWarning.prependTo('body').show();
    }

}

export default {
    init
};
