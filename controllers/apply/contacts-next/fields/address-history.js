'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');

const { CONTACT_EXCLUDED_TYPES, FREE_TEXT_MAXLENGTH } = require('../constants');

module.exports = function addressHistoryField({ locale, name }) {
    const localise = get(locale);
    return {
        type: 'address-history',
        name: name,
        label: localise({
            en: `Have they lived at their home address for the last three years?`,
            cy: `A ydynt wedi byw yn eu cyfeiriad cartref am y tair blynedd diwethaf?`
        }),
        isRequired: true,
        schema: Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(CONTACT_EXCLUDED_TYPES),
            then: Joi.any().strip(),
            otherwise: Joi.object({
                currentAddressMeetsMinimum: Joi.string()
                    .valid(['yes', 'no'])
                    .required(),
                previousAddress: Joi.when(
                    Joi.ref('currentAddressMeetsMinimum'),
                    {
                        is: 'no',
                        then: Joi.ukAddress().required(),
                        otherwise: Joi.any().strip()
                    }
                )
            }).required()
        }),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a full UK address',
                    cy: 'Rhowch gyfeiriad Prydeining llawn'
                })
            },
            {
                type: 'any.required',
                key: 'currentAddressMeetsMinimum',
                message: localise({
                    en: 'Choose from one of the options provided',
                    cy: 'Dewiswch o un o’r opsiynau a ddarperir'
                })
            },
            {
                type: 'any.empty',
                key: 'line1',
                message: localise({
                    en: 'Enter a building and street',
                    cy: 'Rhowch adeilad a stryd'
                })
            },
            {
                type: 'string.max',
                key: 'line1',
                message: localise({
                    en: `Building and street must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i’r adeilad a’r stryd fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            },
            {
                type: 'string.max',
                key: 'line2',
                message: localise({
                    en: `Address line must be ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: `Rhaid i’r llinell cyfeiriad fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            },
            {
                type: 'any.empty',
                key: 'townCity',
                message: localise({
                    en: 'Enter a town or city',
                    cy: 'Rhowch dref neu ddinas'
                })
            },
            {
                type: 'any.empty',
                key: 'county',
                message: localise({
                    en: 'Enter a county',
                    cy: 'Rhowch sir'
                })
            },
            {
                type: 'string.max',
                key: 'townCity',
                message: localise({
                    en: `Town or city must be ${FREE_TEXT_MAXLENGTH.small} characters or less`,
                    cy: `Rhaid i’r dref neu ddinas fod yn llai na ${FREE_TEXT_MAXLENGTH.small} nod`
                })
            },
            {
                type: 'string.max',
                key: 'county',
                message: localise({
                    en: `County must be ${FREE_TEXT_MAXLENGTH.medium} characters or less`,
                    cy: `Rhaid i’r sir fod yn llai na ${FREE_TEXT_MAXLENGTH.medium} nod`
                })
            },
            {
                type: 'any.empty',
                key: 'postcode',
                message: localise({
                    en: 'Enter a postcode',
                    cy: 'Rhowch gôd post'
                })
            },
            {
                type: 'string.postcode',
                key: 'postcode',
                message: localise({
                    en: 'Enter a real postcode',
                    cy: 'Rhowch gôd post go iawn'
                })
            }
        ]
    };
};
