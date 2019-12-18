'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');

module.exports = function(locale) {
    const localise = get(locale);

    return {
        name: 'bankAccountNumber',
        label: localise({ en: 'Account number', cy: 'Rhif cyfrif' }),
        explanation: localise({ en: 'eg. 12345678', cy: 'e.e. 12345678' }),
        type: 'text',
        attributes: { autocomplete: 'off' },
        isRequired: true,
        schema: Joi.string()
            .replace(/\D/g, '')
            .min(6)
            .max(11)
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter an account number',
                    cy: 'Rhowch rif cyfrif'
                })
            },
            {
                type: 'string.min',
                message: localise({
                    en: 'Enter a valid length account number',
                    cy: 'Rhowch rif cyfrif hyd dilys'
                })
            },
            {
                type: 'string.max',
                message: localise({
                    en: 'Enter a valid length account number',
                    cy: 'Rhowch rif cyfrif hyd dilys'
                })
            }
        ]
    };
};
