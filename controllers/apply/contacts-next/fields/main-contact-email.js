'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const EmailField = require('../../lib/field-types/email');

module.exports = function(locale) {
    const localise = get(locale);
    return new EmailField({
        locale: locale,
        name: 'mainContactEmail',
        explanation: localise({
            en: oneLine`We’ll use this whenever we get in
                touch about the project`,
            cy: oneLine`Fe ddefnyddiwn hwn pryd bynnag y
                byddwn yn cysylltu ynglŷn â’r prosiect`
        }),
        schema: Joi.string()
            .email()
            .lowercase()
            .invalid(Joi.ref('seniorContactEmail')),
        messages: [
            {
                type: 'any.invalid',
                message: localise({
                    en: oneLine`Main contact email address must be different
                        from the senior contact's email address`,
                    cy: oneLine`Rhaid i gyfeiriad e-bost y prif gyswllt
                        fod yn wahanol i gyfeiriad e-bost yr uwch gyswllt`
                })
            }
        ]
    });
};
