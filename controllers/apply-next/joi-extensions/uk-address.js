'use strict';

module.exports = function ukAddress(joi) {
    return {
        base: joi.object({
            line1: joi.string().required(),
            line2: joi
                .string()
                .allow('')
                .optional(),
            townCity: joi.string().required(),
            county: joi
                .string()
                .allow('')
                .optional(),
            postcode: joi
                .string()
                .postcode()
                .required()
        }),
        name: 'ukAddress'
    };
};
