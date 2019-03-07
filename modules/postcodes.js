'use strict';

// Allows us to share postcode validation on server and client-side
// via https://github.com/chriso/validator.js/blob/master/lib/isPostalCode.js#L54
// we have to double-escape the regex patterns here to output it as a native RegExp
// but also as a string for the HTML pattern attribute
const POSTCODE_PATTERN = '(gir\\s?0aa|[a-zA-Z]{1,2}\\d[\\da-zA-Z]?\\s?(\\d[a-zA-Z]{2})?)';
const POSTCODE_REGEX = new RegExp(POSTCODE_PATTERN, 'i');

function isValidPostcode(text) {
    return POSTCODE_REGEX.test(text);
}

module.exports = {
    POSTCODE_PATTERN,
    POSTCODE_REGEX,
    isValidPostcode
};
