'use strict';

module.exports = function ukAddress(joi) {
    return {
        type: 'ukAddress',
        base: joi.object({
            line1: joi.string().trim().max(255).required(),
            line2: joi.string().trim().allow('').max(255).optional(),
            townCity: joi.string().trim().max(40).required(),
            county: joi.string().trim().allow('').max(80).optional(),
            postcode: joi.string().trim().postcode().required(),
        }),
    };
};
