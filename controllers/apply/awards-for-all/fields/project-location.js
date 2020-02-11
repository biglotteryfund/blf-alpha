'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const SelectField = require('../../lib/field-types/select');
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

    return new SelectField({
        locale: locale,
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
        defaultOption: localise({
            en: 'Select a location',
            cy: 'Dewiswch leoliad'
        }),
        optgroups: optgroups(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Select a location',
                    cy: 'Dewiswch leoliad'
                })
            }
        ]
    });
};
