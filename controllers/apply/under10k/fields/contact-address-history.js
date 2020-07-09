'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');
const { AddressHistoryField } = require('../../lib/field-types');
const { CONTACT_EXCLUDED_TYPES, FREE_TEXT_MAXLENGTH } = require('../constants');

// @TODO this is duplicated
function stripIfExcludedOrgType(schema) {
    return Joi.when(Joi.ref('organisationType'), {
        is: Joi.exist().valid(CONTACT_EXCLUDED_TYPES),
        then: Joi.any().strip(),
        otherwise: schema,
    });
}

module.exports = function (locale, props) {
    const localise = get(locale);

    const defaultProps = {
        locale: locale,
        label: localise({
            en:
                'Have they lived at their home address for the last three years?',
            cy: `A ydynt wedi byw yn eu cyfeiriad cartref am y tair blynedd diwethaf?`,
        }),
        textMaxLengths: FREE_TEXT_MAXLENGTH,
        schema: stripIfExcludedOrgType(
            Joi.object({
                currentAddressMeetsMinimum: Joi.string()
                    .valid(['yes', 'no'])
                    .required(),
                previousAddress: Joi.when(
                    Joi.ref('currentAddressMeetsMinimum'),
                    {
                        is: 'no',
                        then: Joi.ukAddress().required(),
                        otherwise: Joi.any().strip(),
                    }
                ),
            }).required()
        ),
    };
    return new AddressHistoryField({ ...defaultProps, ...props });
};
