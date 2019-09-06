'use strict';

module.exports = function ukAddress(joi) {
    return {
        name: 'ukAddress',
        base: joi.object({
            line1: joi
                .string()
                .max(255)
                .required(),
            line2: joi
                .string()
                .allow('')
                .max(255)
                .optional(),
            townCity: joi
                .string()
                .max(40)
                .required(),
            county: joi
                .string()
                .allow('')
                .max(80)
                .optional(),
            postcode: joi
                .string()
                .postcode()
                .required()
        })
    };
};
