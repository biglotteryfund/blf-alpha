'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const Field = require('../../lib/field-types/field');

module.exports = function(locale) {
    const localise = get(locale);

    return new Field({
        name: 'projectPostcode',
        label: localise({
            en: `What is the postcode of where your project will take place?`,
            cy: `Beth yw côd post lleoliad eich prosiect?`
        }),
        explanation: localise({
            en: oneLine`If your project will take place across different locations,
                please use the postcode where most of the project will take place.`,
            cy: oneLine`Os bydd eich prosiect wedi’i leoli mewn amryw o leoliadau,
                defnyddiwch y côd post lle bydd y rhan fwyaf o’r prosiect wedi’i leoli.`
        }),
        attributes: {
            size: 10,
            autocomplete: 'postal-code'
        },
        schema: Joi.when('projectCountry', {
            is: Joi.exist(),
            then: Joi.string()
                .postcode()
                .required(),
            otherwise: Joi.any().strip()
        }),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a real postcode',
                    cy: 'Rhowch gôd post go iawn'
                })
            }
        ]
    });
};
