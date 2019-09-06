'use strict';
const countWords = require('../count-words');

module.exports = function wordCount(joi) {
    return {
        base: joi.string(),
        name: 'string',
        language: {
            maxWords: 'must have less than {{max}} words',
            minWords: 'must have at least {{min}} words'
        },
        rules: [
            {
                name: 'maxWords',
                params: {
                    max: joi
                        .number()
                        .integer()
                        .min(0)
                        .required()
                },
                validate(params, value, state, options) {
                    if (countWords(value) > params.max) {
                        return this.createError(
                            'string.maxWords',
                            { max: params.max },
                            state,
                            options
                        );
                    } else {
                        return value;
                    }
                }
            },
            {
                name: 'minWords',
                params: {
                    min: joi
                        .number()
                        .integer()
                        .min(0)
                        .required()
                },
                validate(params, value, state, options) {
                    if (countWords(value) < params.min) {
                        return this.createError(
                            'string.minWords',
                            { min: params.min },
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
