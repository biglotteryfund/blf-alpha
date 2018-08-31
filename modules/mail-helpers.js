'use strict';

/**
 * Get send from address
 *
 * - If we are sending to a biglotteryfund domain use the blf.digital
 * - Otherwise, use the default send from address
 *
 * @param {String} recipient
 */
function getSendAddress(recipient) {
    if (/@biglotteryfund.org.uk$/.test(recipient)) {
        return 'noreply@blf.digital';
    } else {
        return 'noreply@biglotteryfund.org.uk';
    }
}

module.exports = {
    getSendAddress
};
