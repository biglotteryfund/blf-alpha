'use strict';
const { oneLine } = require('common-tags');
const get = require('lodash/fp/get');

const Field = require('../../lib/field-types/field');
const { FREE_TEXT_MAXLENGTH } = require('../constants');

module.exports = function ({ locale, name }) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: name,
        label: localise({
            en: oneLine`Please tell us about any particular
                communication needs this contact has.`,
            cy: oneLine`Dywedwch wrthym am unrhyw anghenion
                cyfathrebu penodol sydd gan y cyswllt hwn.`,
        }),
        isRequired: false,
        maxLength: FREE_TEXT_MAXLENGTH.large,
        messages: [
            {
                type: 'string.max',
                message: localise({
                    en: oneLine`Communication needs must be
                        ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: oneLine`Rhaid i’r anghenion cyfathrebu
                        fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`,
                }),
            },
        ],
    });
};
