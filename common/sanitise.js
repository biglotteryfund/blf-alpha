'use strict';
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
const isString = require('lodash/isString');
const mapValues = require('lodash/mapValues');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function sanitise(input) {
    return DOMPurify.sanitize(input);
}

/**
 * Sanitise request body
 *
 * Accounts for body-parse urlencoded extended values
 * where data is expanded into nested objects and arrays.
 *
 * Only sanitises if the value is a string to avoid
 * unwanted stringify-ing of other values.
 */
function sanitiseRequestBody(body) {
    function sanitiseIfString(value) {
        return isString(value) ? sanitise(value) : value;
    }

    function sanitiseNested(value) {
        if (isObject(value)) {
            return mapValues(value, function(nestedValue) {
                return sanitiseIfString(nestedValue);
            });
        } else {
            return sanitiseIfString(value);
        }
    }

    return mapValues(body, function(value) {
        if (isArray(value)) {
            return value.map(sanitiseNested);
        } else {
            return sanitiseNested(value);
        }
    });
}

module.exports = {
    sanitise,
    sanitiseRequestBody
};
