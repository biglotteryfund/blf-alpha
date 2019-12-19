'use strict';
const get = require('lodash/fp/get');
const orderBy = require('lodash/orderBy');
const { oneLine } = require('common-tags');

const RadioField = require('../../lib/field-types/radio');

module.exports = function(locale) {
    const localise = get(locale);

    const options = [
        {
            value: 'england',
            label: localise({
                en: 'England',
                cy: 'Lloegr'
            })
        },
        {
            value: 'scotland',
            label: localise({
                en: 'Scotland',
                cy: 'Yr Alban'
            })
        },
        {
            value: 'wales',
            label: localise({
                en: 'Wales',
                cy: 'Cymru'
            })
        },
        {
            value: 'northern-ireland',
            label: localise({
                en: 'Northern Ireland',
                cy: 'Gogledd Iwerddon'
            })
        }
    ];

    return new RadioField({
        locale: locale,
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
        options: orderBy(options, ['label'], ['asc']),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Select a country',
                    cy: 'Dewiswch wlad'
                })
            }
        ]
    });
};
