'use strict';
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const isArray = require('lodash/isArray');
const isObject = require('lodash/isObject');
const isString = require('lodash/isString');
const mapValues = require('lodash/mapValues');

const logger = require('./logger').child({ service: 'sanitise' });

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
    function sanitiseIfString(value, key) {
        if (isString(value)) {
            const sanitisedValue = sanitise(value);
            if (sanitisedValue !== value) {
                logger.info(`sanitising ${key}`);
            }

            return sanitisedValue;
        } else {
            return value;
        }
    }

    function sanitiseNested(value, key) {
        if (isObject(value)) {
            return mapValues(value, function(nestedValue, nestedKey) {
                return sanitiseNested(nestedValue, `${key}.${nestedKey}`);
            });
        } else {
            return sanitiseIfString(value, key);
        }
    }

    return mapValues(body, function(value, key) {
        if (isArray(value)) {
            return value.map(arrayValue => sanitiseNested(arrayValue, key));
        } else {
            return sanitiseNested(value, key);
        }
    });
}

module.exports = {
    sanitise,
    sanitiseRequestBody
};
