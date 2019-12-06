'use strict';
const get = require('lodash/fp/get');

const EmailField = require('../../lib/field-types/email');

module.exports = function(locale) {
    const localise = get(locale);

    return new EmailField({
        locale: locale,
        name: 'seniorContactEmail',
        explanation: localise({
            en: `We’ll use this whenever we get in touch about the project`,
            cy: `Byddwn yn defnyddio hwn pan fyddwn yn cysylltu ynglŷn â’r prosiect`
        })
    });
};
