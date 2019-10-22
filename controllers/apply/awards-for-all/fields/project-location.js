'use strict';
const get = require('lodash/fp/get');
const flatMap = require('lodash/flatMap');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const { locationOptions } = require('../../lib/location-options');

module.exports = function(locale, data) {
    const localise = get(locale);

    function optgroups() {
        const country = get('projectCountry')(data);
        const locations = locationOptions(locale);

        let result;
        if (country === 'england') {
            result = locations.england;
        } else if (country === 'scotland') {
            result = locations.scotland;
        } else if (country === 'northern-ireland') {
            result = locations.northernIreland;
        } else if (country === 'wales') {
            result = locations.wales;
        } else {
            result = [];
        }

        return result;
    }
    return {
        name: 'projectLocation',
        label: localise({
            en: 'Where will your project take place?',
            cy: 'Lle bydd eich prosiect wedi’i leoli? '
        }),
        explanation: localise({
            en: oneLine`If your project covers more than one area please
                tell us where most of it will take place`,
            cy: oneLine`Os yw eich prosiect mewn mwy nag un ardal, dywedwch
                wrthym lle bydd y rhan fwyaf ohono yn cymryd lle.`
        }),
        type: 'select',
        defaultOption: localise({
            en: 'Select a location',
            cy: 'Dewiswch leoliad'
        }),
        optgroups: optgroups(),
        isRequired: true,
        schema: Joi.when('projectCountry', {
            is: Joi.exist(),
            then: Joi.string()
                .valid(
                    flatMap(optgroups(), group => group.options).map(
                        option => option.value
                    )
                )
                .required(),
            otherwise: Joi.any().strip()
        }),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Select a location',
                    cy: 'Dewiswch leoliad'
                })
            }
        ]
    };
};
