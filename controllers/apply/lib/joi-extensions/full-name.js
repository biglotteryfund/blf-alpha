'use strict';

module.exports = function fullName(joi) {
    return {
        name: 'fullName',
        base: joi.object({
            firstName: joi.string().trim().max(40).required(),
            lastName: joi.string().trim().max(80).required(),
        }),
    };
};
