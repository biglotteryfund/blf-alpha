import $ from 'jquery';
import { storageAvailable } from '../helpers/storage';
const { trackEvent } = require('../helpers/metrics');
const canStore = storageAvailable('localStorage');

function init() {
    const $cookieWarning = $('#js-cookie-consent');
    const $acceptButton = $('#js-cookie-consent-accept');

    const hasAccepted = canStore && window.localStorage.getItem('biglotteryfund:cookie-consent') === 'true';

    if (hasAccepted === false) {
        setTimeout(() => {
            $cookieWarning.prependTo('body').addClass('is-shown');
            $acceptButton.on('click', function() {
                window.localStorage.setItem('biglotteryfund:cookie-consent', 'true');
                trackEvent('Cookie Warning', 'Click', 'Accept');
                $cookieWarning.removeClass('is-shown');
            });
        }, 250);
    }
}

export default {
    init
};
