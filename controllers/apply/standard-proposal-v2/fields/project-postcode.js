'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const Field = require('../../lib/field-types/field');

module.exports = function (locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'projectLocationPostcode',
        label: localise({
            en: `What is the postcode of where your project will take place?`,
            cy: `Beth yw côd post lleoliad eich prosiect?`,
        }),
        explanation: localise({
            en: oneLine`If your project will take place across different locations,
                please use the postcode where most of the project will take place
                eg. EC4A 1DE.`,
            cy: ``,
        }),
        attributes: { size: 10, autocomplete: 'postal-code' },
        schema: Joi.string().postcode().required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a real postcode',
                    cy: 'Rhowch gôd post go iawn',
                }),
            },
        ],
    });
};
