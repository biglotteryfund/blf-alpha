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
    return DOMPurify.sanitize(input).replace(/&amp;/g, '&');
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
        if (isString(value)) {
            return sanitise(value);
        } else {
            return value;
        }
    }

    function sanitiseNested(value) {
        if (isObject(value)) {
            return mapValues(value, function (nestedValue) {
                return sanitiseNested(nestedValue);
            });
        } else {
            return sanitiseIfString(value);
        }
    }

    return mapValues(body, function (value) {
        if (isArray(value)) {
            return value.map((arrayValue) => sanitiseNested(arrayValue));
        } else {
            return sanitiseNested(value);
        }
    });
}

module.exports = {
    sanitise,
    sanitiseRequestBody,
};
