'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const EmailField = require('../../lib/field-types/email');

module.exports = function(locale) {
    const localise = get(locale);
    return new EmailField({
        locale: locale,
        name: 'seniorContactEmail',
        explanation: localise({
            en: oneLine`We’ll use this whenever we get
                in touch about the project`,
            cy: oneLine`Byddwn yn defnyddio hwn pan
                fyddwn yn cysylltu ynglŷn â’r prosiect`
        })
    });
};
