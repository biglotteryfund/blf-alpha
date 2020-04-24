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
        base: joi.object(),
        name: 'object',
        language: {
            isEqual: 'Object values must not match',
        },
        rules: [
            {
                name: 'compare',
                params: {
                    ref: joi.func().ref(),
                },
                validate(params, value, state, options) {
                    const referenceValue = params.ref(
                        state.reference || state.parent,
                        options
                    );

                    if (
                        isObject(value) &&
                        isObject(referenceValue) &&
                        isEqual(
                            normaliseValues(value),
                            normaliseValues(referenceValue)
                        ) === true
                    ) {
                        return this.createError(
                            'object.isEqual',
                            { v: value },
                            state,
                            options
                        );
                    } else {
                        return value;
                    }
                },
            },
        ],
    };
};
