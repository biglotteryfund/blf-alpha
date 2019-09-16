'use strict';
const isString = require('lodash/isString');

module.exports = function(joi) {
    return {
        type: 'friendlyNumber',
        base: joi.number(),
        /* eslint-disable-next-line no-unused-vars */
        coerce(value) {
            if (isString(value)) {
                // Strip out any non-numeric characters (eg. ,) but keep decimal points
                return { value: parseFloat(value.replace(/[^0-9.]/g, '')) };
            }
        }
    };
};
