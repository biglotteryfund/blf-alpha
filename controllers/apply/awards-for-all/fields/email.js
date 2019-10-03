'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');

module.exports = function(locale, props, additionalMessages = []) {
    const localise = get(locale);
    const defaultProps = {
        label: localise({
            en: 'Email',
            cy: 'E-bost'
        }),
        type: 'email',
        attributes: { autocomplete: 'email' },
        isRequired: true,
        schema: Joi.string()
            .email()
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter an email address',
                    cy: 'Rhowch gyfeiriad e-bost'
                })
            },
            {
                type: 'string.email',
                message: localise({
                    en: `Email address must be in the correct format, like name@example.com`,
                    cy: `Rhaid i’r cyfeiriad e-bost for yn y ffurf cywir, e.e enw@example.com`
                })
            }
        ].concat(additionalMessages)
    };

    return { ...defaultProps, ...props };
};
