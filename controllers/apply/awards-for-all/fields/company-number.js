'use strict';
const get = require('lodash/fp/get');

const { COMPANY_NUMBER_TYPES, FREE_TEXT_MAXLENGTH } = require('../constants');
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
        name: 'companyNumber',
        label: localise({
            en: 'Companies House number',
            cy: 'Rhif Tŷ’r Cwmnïau'
        }),
        type: 'text',
        isRequired: true,
        schema: stripUnlessOrgTypes(
            COMPANY_NUMBER_TYPES,
            Joi.string()
                .max(FREE_TEXT_MAXLENGTH.large)
                .required()
        ),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter your organisation’s Companies House number',
                    cy: 'Rhowch rif Tŷ’r Cwmnïau eich sefydliad'
                })
            },
            {
                type: 'string.max',
                message: localise({
                    en: `Companies House number must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i’r rhif Tŷ’r Cwmnïau fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            }
        ]
    };
};
