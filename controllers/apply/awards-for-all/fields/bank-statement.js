'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');
const { FILE_LIMITS } = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);

    return {
        name: 'bankStatement',
        label: localise({
            en: 'Upload a bank statement',
            cy: 'Uwch lwytho cyfriflen banc'
        }),
        // Used when editing an existing bank statement
        labelExisting: localise({
            en: 'Upload a new bank statement',
            cy: 'Uwch lwytho cyfriflen banc newydd'
        }),
        type: 'file',
        attributes: {
            accept: FILE_LIMITS.TYPES.map(type => type.mime).join(',')
        },
        isRequired: true,
        schema: Joi.object({
            filename: Joi.string().required(),
            size: Joi.number()
                .max(FILE_LIMITS.SIZE.value)
                .required(),
            type: Joi.string()
                .valid(FILE_LIMITS.TYPES.map(type => type.mime))
                .required()
        }).required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Provide a bank statement',
                    cy: 'Darparwch gyfriflen banc'
                })
            },
            {
                type: 'any.allowOnly',
                message: localise({
                    en: `Please upload a file in one of these formats: ${FILE_LIMITS.TYPES.map(
                        type => type.label
                    ).join(', ')}`,
                    cy: `Uwch lwythwch ffeil yn un o’r fformatiau hyn: ${FILE_LIMITS.TYPES.map(
                        type => type.label
                    ).join(', ')}`
                })
            },
            {
                type: 'number.max',
                message: localise({
                    en: `Please upload a file below ${FILE_LIMITS.SIZE.label}`,
                    cy: `Uwch lwythwch ffeil isod ${FILE_LIMITS.SIZE.label}`
                })
            }
        ]
    };
};
