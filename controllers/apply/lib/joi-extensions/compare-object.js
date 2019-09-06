'use strict';
const isEqual = require('lodash/isEqual');

module.exports = function(joi) {
    return {
        base: joi.object(),
        name: 'object',
        language: {
            isEqual: 'Objects must not match'
        },
        rules: [
            {
                name: 'compare',
                params: {
                    ref: joi.func().ref()
                },
                validate(params, value, state, options) {
                    const refVal = params.ref(
                        state.reference || state.parent,
                        options
                    );

                    if (isEqual(refVal, value) === true) {
                        return this.createError(
                            'object.isEqual',
                            { v: value },
                            state,
                            options
                        );
                    } else {
                        return value;
                    }
                }
            }
        ]
    };
};
