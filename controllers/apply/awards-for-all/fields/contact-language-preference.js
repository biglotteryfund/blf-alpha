'use strict'
const get = require('lodash/fp/get');

const Joi = require('../../form-router-next/joi-extensions');

module.exports = function fieldContactLanguagePreference(locale, props) {
    const localise = get(locale);
    const defaultProps = {
        label: localise({
            en: `What language should we use to contact this person?`,
            cy: `Pa iaith y dylem ei ddefnyddio i gysylltu â’r person hwn?`
        }),
        type: 'radio',
        options: [
            {
                value: 'english',
                label: localise({
                    en: `English`,
                    cy: `Saesneg`
                })
            },
            {
                value: 'welsh',
                label: localise({
                    en: `Welsh`,
                    cy: `Cymraeg`
                })
            }
        ],
        isRequired: true,
        get schema() {
            return Joi.when('projectCountry', {
                is: 'wales',
                then: Joi.string()
                    .valid(this.options.map(option => option.value))
                    .required(),
                otherwise: Joi.any().strip()
            });
        },
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
    return { ...defaultProps, ...props };
};
