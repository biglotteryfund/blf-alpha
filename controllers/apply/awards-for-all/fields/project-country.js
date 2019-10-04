'use strict';
const get = require('lodash/fp/get');
const has = require('lodash/has');
const orderBy = require('lodash/orderBy');
const { oneLine } = require('common-tags');
const config = require('config');

const Joi = require('../../lib/joi-extensions');

module.exports = function(locale) {
    const localise = get(locale);
    const allowedCountries = config.get('awardsForAll.allowedCountries');

    function options() {
        function label(country) {
            let result = '';
            if (country === 'england') {
                result = localise({
                    en: 'England',
                    cy: 'Lloegr'
                });
            } else if (country === 'scotland') {
                result = localise({
                    en: 'Scotland',
                    cy: 'Yr Alban'
                });
            } else if (country === 'northern-ireland') {
                result = localise({
                    en: 'Northern Ireland',
                    cy: 'Gogledd Iwerddon'
                });
            } else if (country === 'wales') {
                result = localise({
                    en: 'Wales',
                    cy: 'Cymru'
                });
            }

            if (allowedCountries.includes(country) === false) {
                result += localise({
                    en: ' (coming soon)',
                    cy: ' (Dod yn fuan)'
                });
            }

            return result;
        }

        const countries = ['england', 'scotland', 'wales', 'northern-ireland'];
        const options = countries.map(function(country) {
            const option = { value: country, label: label(country) };

            if (allowedCountries.includes(country) === false) {
                option.attributes = { disabled: 'disabled' };
            }

            return option;
        });

        return orderBy(
            options,
            ['attributes.disabled', 'label'],
            ['desc', 'asc']
        );
    }

    const activeOptions = options().filter(
        option => has(option, 'attributes.disabled') === false
    );

    return {
        name: 'projectCountry',
        label: localise({
            en: `What country will your project be based in?`,
            cy: `Pa wlad fydd eich prosiect wedi’i leoli?`
        }),
        explanation: localise({
            en: oneLine`We work slightly differently depending on which
                country your project is based in, to meet local needs
                and the regulations that apply there.`,
            cy: oneLine`Rydym yn gweithredu ychydig yn wahanol, yn ddibynnol 
                ar pa wlad mae eich prosiect wedi’i leoli i ddiwallu 
                anghenion lleol a’r rheoliadau sy’n berthnasol yna.`
        }),
        type: 'radio',
        options: options(),
        isRequired: true,
        schema: Joi.string()
            .valid(activeOptions.map(option => option.value))
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Select a country',
                    cy: 'Dewiswch wlad'
                })
            }
        ]
    };
};
