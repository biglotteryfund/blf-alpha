'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');

module.exports = function(locale, name) {
    const localise = get(locale);

    const options = [
        { value: 'english', label: localise({ en: `English`, cy: `Saesneg` }) },
        { value: 'welsh', label: localise({ en: `Welsh`, cy: `Cymraeg` }) }
    ];

    return {
        name: name,
        label: localise({
            en: `What language should we use to contact this person?`,
            cy: `Pa iaith y dylem ei ddefnyddio i gysylltu â’r person hwn?`
        }),
        type: 'radio',
        options: options,
        isRequired: true,
        schema: Joi.when('projectCountry', {
            is: 'wales',
            then: Joi.string()
                .valid(options.map(option => option.value))
                .required(),
            otherwise: Joi.any().strip()
        }),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Select a language',
                    cy: 'Dewiswch iaith'
                })
            }
        ]
    };
};
