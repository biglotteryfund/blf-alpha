'use strict';
const isEqual = require('lodash/isEqual');

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

                    if (
                        isEqual(
                            Object.values(value).map(normalise),
                            Object.values(referenceValue).map(normalise)
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
