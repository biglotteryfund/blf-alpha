'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const Field = require('../../lib/field-types/field');
const { FREE_TEXT_MAXLENGTH } = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'projectLocationDescription',
        label: localise({
            en: oneLine`Tell us the towns or villages where people who
                will benefit from your project live`,
            cy: oneLine`Dywedwch wrthym y trefi neu bentrefi mae’r bobl
                a fydd yn elwa o’ch prosiect yn byw`
        }),
        schema: Joi.when('projectCountry', {
            is: Joi.exist(),
            then: Joi.string()
                .max(FREE_TEXT_MAXLENGTH.large)
                .required(),
            otherwise: Joi.any().strip()
        }),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: oneLine`Tell us the towns, villages or wards
                        your beneficiaries live in`,
                    cy: oneLine`Dywedwch wrthym y trefi, pentrefi
                        neu wardiau mae eich buddiolwyr yn byw`
                })
            },
            {
                type: 'string.max',
                message: localise({
                    en: oneLine`Project locations must be
                        ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: oneLine`Rhaid i leoliadau’r prosiect fod yn llai na
                        ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            }
        ]
    });
};
