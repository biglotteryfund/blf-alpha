'use strict';

module.exports = function fullName(joi) {
    return {
        name: 'fullName',
        base: joi.object({
            firstName: joi
                .string()
                .max(40)
                .required(),
            lastName: joi
                .string()
                .max(80)
                .required()
        })
    };
};
