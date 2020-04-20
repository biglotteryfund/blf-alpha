'use strict';
const isEqual = require('lodash/isEqual');
const isObject = require('lodash/isObject');
const sortBy = require('lodash/sortBy');

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

                    /**
                     * Convert object values to an array of normalised strings
                     * Assumes a constraint that object only contains strings.
                     * @param value
                     * @returns {string}
                     */
                    function normalise(value) {
                        return value.toString().toLowerCase().trim();
                    }

                    if (isObject(value) && isObject(referenceValue)) {
                        if (
                            isEqual(
                                sortBy(Object.values(value).map(normalise)),
                                sortBy(
                                    Object.values(referenceValue).map(normalise)
                                )
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
                    } else {
                        return value;
                    }
                },
            },
        ],
    };
};
