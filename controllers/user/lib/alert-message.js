'use strict';
const get = require('lodash/fp/get');

module.exports = function alertMessage({ locale, status }) {
    const localise = get(locale);

    let result;
    switch (status) {
        case 'activationComplete':
            result = localise({
                en: `Your account was successfully activated!`,
                cy: ``
            });
            break;
        case 'passwordUpdated':
            result = localise({
                en: `Your password was successfully updated!`,
                cy: ``
            });
            break;
        case 'emailUpdated':
            result = localise({
                en: `Your email address was successfully updated!`,
                cy: ``
            });
            break;
        case 'loggedOut':
            result = localise({
                en: `You were successfully logged out.`,
                cy: ``
            });
            break;
        case 'passwordResetRequest':
            result = localise({
                en: `Password reset requested. If the email address entered is correct, you will receive further instructions via email.`,
                cy: ``
            });
            break;
    }
    return result;
};
