'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Field = require('../../lib/field-types/field');
const { FREE_TEXT_MAXLENGTH } = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'organisationTradingName',
        label: localise({
            en: oneLine`If your organisation uses a different name
                in your day-to-day work, tell us it here`,
            cy: oneLine`Os yw eich sefydliad yn defnyddio enw gwahanol
                yn eich gwaith dydd i ddydd, dywedwch wrthym yma`
        }),
        isRequired: false,
        maxLength: FREE_TEXT_MAXLENGTH.large,
        messages: [
            {
                type: 'string.max',
                message: localise({
                    en: oneLine`Organisation's day-to-day name must be
                        ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: oneLine`Rhaid i enw dydd i ddydd y sefydliad fod yn
                        llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            }
        ]
    });
};
