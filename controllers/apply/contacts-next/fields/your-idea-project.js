'use strict';
const get = require('lodash/fp/get');
const Joi = require('../../lib/joi-extensions');

module.exports = function(locale) {
    const localise = get(locale);

    const minWords = 50;
    const maxWords = 300;

    return {
        name: 'yourIdeaProject',
        label: localise({
            en: `What would you like to do?`,
            cy: `Beth yr hoffech ei wneud?`
        }),
        explanation: localise({
            en: `<p><strong>
                Here are some ideas of what to tell us about your project:
            </strong></p>
            <ul>
                <li>What you would like to do</li>
                <li>What difference your project will make</li>
                <li>Who will benefit from it</li>
                <li>How long you expect to run it for. This can be an estimate</li>
                <li>How you'll make sure people know about it</li>
                <li>How you plan to learn from it and use this
                    learning to shape future projects</li>
                <li>Is it something new, or are you continuing something that
                    has worked well previously? We want to fund both types of projects</li>
            </ul>
            <p><strong>
                You can write up to ${maxWords} words for this section,
                but don't worry if you use less.
            </strong></p>`,

            cy: `<p><strong>
                Dyma rhai syniadau o’r hyn i ddweud wrthym am eich prosiect:
            </strong></p>
            <ul>
                <li>Beth y hoffech ei wneud?</li>
                <li>Pa wahaniaeth bydd eich prosiect yn ei wneud?</li>
                <li>Pwy fydd yn cael budd ohono?</li>
                <li>Am ba mor hir rydych yn disgwyl ei gynnal?
                    Gall hyn fod yn amcangyfrif.</li> 
                <li>Sut y byddwch yn sicrhau fod pobl yn gwybod amdano?</li>
                <li>Sut rydych yn bwriadu dysgu ohono a defnyddio’r wybodaeth 
                hwn i siapio prosiectau yn y dyfodol?</li>
                <li>A yw’n rhywbeth newydd, neu ydych yn parhau â rhywbeth
                    sydd wedi gweithio’n dda yn flaenorol? Rydym eisiau
                    ariannu’r ddau fath o brosiectau.</li>

            </ul>
            <p><strong>
                Gallwch ysgrifennu hyd at ${maxWords} gair i’r adran hon,
                ond mae modd ysgrifennu llai.
            </strong></p>`
        }),
        type: 'textarea',
        settings: {
            stackedSummary: true,
            showWordCount: true,
            minWords: minWords,
            maxWords: maxWords
        },
        attributes: { rows: 20 },
        isRequired: true,
        schema: Joi.string()
            .minWords(minWords)
            .maxWords(maxWords)
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Tell us about your project',
                    cy: 'Dywedwch wrthym am eich prosiect'
                })
            },
            {
                type: 'string.minWords',
                message: localise({
                    en: `Answer must be at least ${minWords} words`,
                    cy: `Rhaid i’r ateb fod yn o leiaf ${minWords} gair`
                })
            },
            {
                type: 'string.maxWords',
                message: localise({
                    en: `Answer must be no more than ${maxWords} words`,
                    cy: `Rhaid i’r ateb fod yn llai na ${maxWords} gair`
                })
            }
        ]
    };
};
