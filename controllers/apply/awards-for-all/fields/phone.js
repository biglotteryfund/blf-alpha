'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');

module.exports = function(locale, props, additionalMessages = []) {
    const localise = get(locale);
    const defaultProps = {
        label: localise({ en: 'Telephone number', cy: 'Rhif ffôn' }),
        type: 'tel',
        attributes: { size: 30, autocomplete: 'tel' },
        isRequired: true,
        schema: Joi.string()
            .phoneNumber()
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig'
                })
            },
            {
                type: 'string.phonenumber',
                message: localise({
                    en: 'Enter a real UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig go iawn'
                })
            }
        ].concat(additionalMessages)
    };

    return { ...defaultProps, ...props };
};
