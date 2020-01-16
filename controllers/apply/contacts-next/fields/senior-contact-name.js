'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const NameField = require('../../lib/field-types/name');

module.exports = function(locale) {
    const localise = get(locale);

    return new NameField({
        locale: locale,
        name: 'seniorContactName',
        label: localise({
            en: 'Full name of senior contact',
            cy: 'Enw llawn yr uwch gyswllt'
        }),
        schema: Joi.fullName()
            .compare(Joi.ref('mainContactName'))
            .required(),
        messages: [
            {
                type: 'object.isEqual',
                message: localise({
                    en: oneLine`Senior contact name must be different
                        from the main contact's name`,
                    cy: oneLine`Rhaid i enw’r uwch gyswllt fod yn
                        wahanol i enw’r prif gyswllt`
                })
            }
        ]
    });
};
