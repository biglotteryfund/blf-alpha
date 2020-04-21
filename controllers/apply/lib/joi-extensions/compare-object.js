'use strict';
const isEqual = require('lodash/isEqual');
const isObject = require('lodash/isObject');
const sortBy = require('lodash/sortBy');

/**
 * Convert object values to an array of normalised strings
 * Assumes a constraint that object only contains strings.
 */
function normaliseValues(sourceObject) {
    return sortBy(
        Object.values(sourceObject).map(function (value) {
            return value.toString().toLowerCase().trim();
        })
    );
}

module.exports = function (joi) {
    return {
        type: 'object',
        base: joi.object(),
        messages: {
            'object.isEqual': 'Object values must not match',
        },
        rules: {
            compare: {
                method(referenceValue) {
                    return this.$_addRule({
                        name: 'compare',
                        args: { referenceValue },
                    });
                },
                args: [
                    {
                        name: 'referenceValue',
                        ref: true, // Expand references
                        assert: joi.object(),
                        message: 'must be a referenced object',
                    },
                ],
                validate(value, helpers, args) {
                    if (
                        isObject(value) &&
                        isObject(args.referenceValue) &&
                        isEqual(
                            normaliseValues(value),
                            normaliseValues(args.referenceValue)
                        ) === true
                    ) {
                        return helpers.error('object.isEqual');
                    } else {
                        return value;
                    }
                },
            },
        },
    };
};
