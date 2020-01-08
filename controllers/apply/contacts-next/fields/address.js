'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');
const { FREE_TEXT_MAXLENGTH } = require('../constants');

module.exports = function(locale, props, additionalMessages = []) {
    const localise = get(locale);
    const defaultProps = {
        type: 'address',
        isRequired: true,
        schema: Joi.ukAddress().required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a full UK address',
                    cy: 'Rhowch gyfeiriad Prydeinig llawn'
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
        ].concat(additionalMessages)
    };

    return { ...defaultProps, ...props };
};
