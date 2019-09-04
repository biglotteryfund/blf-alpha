'use strict';
const get = require('lodash/fp/get');
const Joi = require('../../form-router-next/joi-extensions');

module.exports = function(locale) {
    const localise = get(locale);

    const minWords = 50;
    const maxWords = 150;

    return {
        name: 'yourIdeaPriorities',
        label: localise({
            en: `How does your project meet at least one of our funding priorities?`,
            cy: `Sut mae eich prosiect yn bodloni o leiaf un o’n tair blaenoriaeth ariannu?`
        }),
        explanation: localise({
            en: `<p>
                National Lottery Awards for All has three funding priorities, 
                please tell us how your project will
                <strong>meet at least one of these:</strong>
            </p>
            <ol>
                <li>Bring people together and build strong
                    relationships in and across communities</li>
                <li>Improve the places and spaces that matter to communities</li>
                <li>Help more people to reach their potential,
                    by supporting them at the earliest possible stage</li>
            </ol>
            <p>You can tell us if your project meets more than one priority,
               but don't worry if it doesn't.</p>
            <p><strong>
                You can write up to ${maxWords} words for this section,
                but don't worry if you use less.
            </strong></p>`,

            cy: `<p>
                Mae gan Arian i Bawb y Loteri Genedlaethol dair blaenoriaeth
                ariannu, dywedwch wrthym sut bydd eich prosiect yn
                <strong>bodloni o leiaf un o’r rhain</strong>:
            </p>
            <ol>
                <li>Dod â phobl ynghyd a chreu perthnasau cryf o fewn ac ar draws cymunedau</li>
                <li>Gwella’r ardaloedd a gofodau sy’n bwysig i gymunedau</li>
                <li>Helpu mwy o bobl i gyflawni eu potensial drwy eu cefnogi ar y cam cyntaf posib.</li>
            </ol>
            <p>Gallwch ddweud wrthym os yw eich prosiect yn cwrdd â mwy nag un
               flaenoriaeth, ond peidiwch â phoeni os na fydd.</p>
            <p><strong>
                Gallwch ysgrifennu hyd at ${maxWords} gair i’r adran hon, ond
                peidiwch â phoeni os byddwch yn defnyddio llai. 
            </strong></p>`
        }),
        type: 'textarea',
        settings: {
            stackedSummary: true,
            showWordCount: true,
            minWords: minWords,
            maxWords: maxWords
        },
        attributes: {
            rows: 12
        },
        isRequired: true,
        schema: Joi.string()
            .minWords(minWords)
            .maxWords(maxWords)
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: `Tell us how your project meets at least one of our funding priorities`,
                    cy: `Dywedwch wrthym sut mae eich prosiect yn cwrdd ag o leiaf un o’n blaenoriaethau ariannu`
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
