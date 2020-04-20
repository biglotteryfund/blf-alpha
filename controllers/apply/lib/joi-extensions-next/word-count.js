'use strict';
const countWords = require('../count-words');

module.exports = function wordCount(joi) {
    return {
        type: 'string',
        base: joi.string(),
        messages: {
            'string.minWords': 'must have at least {{#min}} words',
            'string.maxWords': 'must have no more than {{#max}} words',
        },
        rules: {
            maxWords: {
                method(max) {
                    return this.$_addRule({
                        name: 'maxWords',
                        args: { max },
                    });
                },
                args: [
                    {
                        name: 'max',
                        ref: true,
                        assert: joi.number().integer().min(0).required(),
                        message: 'must be a number',
                    },
                ],
                validate(value, helpers, args) {
                    if (countWords(value) > args.max) {
                        return helpers.error('string.maxWords', {
                            max: args.max,
                        });
                    } else {
                        return value;
                    }
                },
            },
            minWords: {
                method(min) {
                    return this.$_addRule({
                        name: 'minWords',
                        args: { min },
                    });
                },
                args: [
                    {
                        name: 'min',
                        ref: true,
                        assert: joi.number().integer().min(0).required(),
                        message: 'must be a number',
                    },
                ],
                validate(value, helpers, args) {
                    if (countWords(value) < args.min) {
                        return helpers.error('string.minWords', {
                            min: args.min,
                        });
                    } else {
                        return value;
                    }
                },
            },
        },
    };
};
