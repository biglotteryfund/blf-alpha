'use strict';
const get = require('lodash/fp/get');

const { CHARITY_NUMBER_TYPES, FREE_TEXT_MAXLENGTH } = require('../constants');
const Joi = require('../../lib/joi-extensions');

module.exports = function(locale, data) {
    /**
     * Charity number fields schema
     * If organisation type is in required list then this field is required
     * Or, if organisation type is in the optional list then this field is optional
     * Otherwise, strip the value from the resulting data
     * Note: .optional doesn't allow null so needs to also allow null
     */
    const localise = get(locale);
    const currentOrganisationType = get('organisationType')(data);

    const excludeRegex = /^[^Oo]+$/;
    const schema = Joi.when(Joi.ref('organisationType'), {
        is: Joi.exist().valid(CHARITY_NUMBER_TYPES.required),
        then: Joi.string()
            .regex(excludeRegex)
            .max(FREE_TEXT_MAXLENGTH.large)
            .required()
    }).when(Joi.ref('organisationType'), {
        is: Joi.exist().valid(CHARITY_NUMBER_TYPES.optional),
        then: Joi.string()
            .regex(excludeRegex)
            .max(FREE_TEXT_MAXLENGTH.large)
            .optional()
            .allow('', null),
        otherwise: Joi.any().strip()
    });

    return {
        name: 'charityNumber',
        label: localise({
            en: 'Charity registration number',
            cy: 'Rhif cofrestru elusen'
        }),
        type: 'text',
        attributes: { size: 20 },
        isRequired: CHARITY_NUMBER_TYPES.required.includes(
            currentOrganisationType
        ),
        schema: schema,
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter your organisation’s charity number',
                    cy: 'Rhowch rif elusen eich sefydliad'
                })
            },
            {
                type: 'string.regex.base',
                message: localise({
                    en:
                        'Enter a real charity registration number. And don’t use any spaces. Scottish charity registration numbers must also use the number ‘0’ in ‘SC0’ instead of the letter ‘O’.',
                    cy:
                        'Rhowch rif cofrestru elusen go iawn. A pheidiwch â defnyddio unrhyw fylchau. Rhaid i rifau cofrestru elusennau Albanaidd ddefnyddio’r rhif ‘0’ yn ‘SC0’ yn hytrach na’r llythyren ‘O’'
                })
            },
            {
                type: 'string.max',
                message: localise({
                    en: `Charity registration number must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i rif cofrestredig yr elusen fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            }
        ]
    };
};
