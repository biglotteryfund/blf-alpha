'use strict';

module.exports = function ukAddress(joi) {
    return {
        base: joi.object({
            'building-street': joi.string().required(),
            'town-city': joi.string().required(),
            'county': joi
                .string()
                .allow('')
                .optional(),
            'postcode': joi
                .string()
                .postcode()
                .required()
        }),
        name: 'ukAddress'
    };
};
