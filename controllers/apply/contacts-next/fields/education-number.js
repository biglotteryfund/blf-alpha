'use strict';
const get = require('lodash/fp/get');

const { EDUCATION_NUMBER_TYPES, FREE_TEXT_MAXLENGTH } = require('../constants');
const Joi = require('../../lib/joi-extensions');

module.exports = function(locale) {
    const localise = get(locale);

    function stripUnlessOrgTypes(types, schema) {
        return Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(types),
            then: schema,
            otherwise: Joi.any().strip()
        });
    }

    return {
        name: 'educationNumber',
        label: localise({
            en: 'Department for Education number',
            cy: 'Eich rhif Adran Addysg'
        }),
        type: 'text',
        isRequired: true,
        schema: stripUnlessOrgTypes(
            EDUCATION_NUMBER_TYPES,
            Joi.string()
                .max(FREE_TEXT_MAXLENGTH.large)
                .required()
        ),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: `Enter your organisation’s Department for Education number`,
                    cy: `Rhowch rif Adran Addysg eich sefydliad`
                })
            },
            {
                type: 'string.max',
                message: localise({
                    en: `Department for Education number must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i rif yr Adran Addysg fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            }
        ]
    };
};
