'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Field = require('../../lib/field-types/field');
const { FREE_TEXT_MAXLENGTH } = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);
    return new Field({
        name: 'seniorContactCommunicationNeeds',
        label: localise({
            en: oneLine`Please tell us about any particular
                communication needs this contact has.`,
            cy: oneLine`Dywedwch wrthym am unrhyw anghenion
                cyfathrebu penodol sydd gan y cyswllt hwn.`
        }),
        isRequired: false,
        messages: [
            {
                type: 'string.max',
                message: localise({
                    en: oneLine`Particular communication needs must be
                        ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: oneLine`Rhaid i’r anghenion cyfathrebu penodol
                        fod yn llai na ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            }
        ]
    });
};
