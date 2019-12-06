'use strict';
const get = require('lodash/fp/get');

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
        explanation: localise({
            en: 'This person has to live in the UK.',
            cy: 'Rhaid i’r person hwn fyw ym Mhrydain'
        }),
        schema: Joi.fullName()
            .compare(Joi.ref('mainContactName'))
            .required(),
        messages: [
            {
                type: 'object.isEqual',
                message: localise({
                    en: `Senior contact name must be different from the main contact's name`,
                    cy: `Rhaid i enw’r uwch gyswllt fod yn wahanol i enw’r prif gyswllt`
                })
            }
        ]
    });
};
