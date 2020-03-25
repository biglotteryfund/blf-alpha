'use strict';
const PhoneField = require('../../lib/field-types/phone');

module.exports = function (locale) {
    return new PhoneField({
        locale: locale,
        name: 'seniorContactPhone',
    });
};
