'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');
const { AddressHistoryField } = require('../../lib/field-types');
const { CONTACT_EXCLUDED_TYPES, FREE_TEXT_MAXLENGTH } = require('../constants');

function stripIfExcludedOrgType(schema) {
    return Joi.when(Joi.ref('organisationType'), {
        is: Joi.exist().valid(CONTACT_EXCLUDED_TYPES),
        then: Joi.any().strip(),
        otherwise: schema,
    });
}

function buildFieldProps(locale, props = {}) {
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
    return { ...defaultProps, ...props };
}

module.exports = {
    fieldMainContactAddressHistory(locale) {
        const props = buildFieldProps(locale, {
            name: 'mainContactAddressHistory',
        });
        return new AddressHistoryField(props);
    },
    fieldSeniorContactAddressHistory(locale) {
        const props = buildFieldProps(locale, {
            name: 'seniorContactAddressHistory',
        });
        return new AddressHistoryField(props);
    },
};
