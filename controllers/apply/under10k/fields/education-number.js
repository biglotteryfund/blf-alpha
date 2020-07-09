'use strict';
const get = require('lodash/fp/get');

const { EDUCATION_NUMBER_TYPES, FREE_TEXT_MAXLENGTH } = require('../constants');
const Joi = require('../../lib/joi-extensions');
const Field = require('../../lib/field-types/field');

module.exports = function (locale) {
    const localise = get(locale);

    // @TODO this is shared
    function stripUnlessOrgTypes(types, schema) {
        return Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(types),
            then: schema,
            otherwise: Joi.any().strip(),
        });
    }

    return new Field({
        locale: locale,
        name: 'educationNumber',
        label: localise({
            en: 'Department for Education number',
            cy: 'Eich rhif Adran Addysg',
        }),
        isRequired: true,
        schema: stripUnlessOrgTypes(
            EDUCATION_NUMBER_TYPES,
            Joi.string().max(FREE_TEXT_MAXLENGTH.large).required()
        ),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: `Enter your organisation’s Department for Education number`,
                    cy: `Rhowch rif Adran Addysg eich sefydliad`,
                }),
            },
            {
                type: 'string.max',
                message: localise({
                    en: `Department for Education number must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i rif yr Adran Addysg fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                }),
            },
        ],
    });
};
