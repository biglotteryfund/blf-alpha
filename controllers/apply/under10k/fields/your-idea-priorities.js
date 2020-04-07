'use strict';
const get = require('lodash/fp/get');

const TextareaField = require('../../lib/field-types/textarea');

module.exports = function (locale) {
    const localise = get(locale);

    const minWords = 50;
    const maxWords = 150;

    return new TextareaField({
        locale: locale,
        name: 'yourIdeaPriorities',
        label: localise({
            en: `How does your project meet at least one of our funding priorities?`,
            cy: `Sut mae eich prosiect yn bodloni o leiaf un o’n tair blaenoriaeth ariannu?`,
        }),
        explanation: localise({
            en: `<p>
                <strong>If your project is COVID-19 related, we will prioritise:</strong>
            </p>
            <ol>
                <li>Organisations supporting people who are at high risk from COVID-19</li>
                <li>Organisations supporting communities most likely to face increased
                    demand and challenges as a direct result of COVID-19</li>
                <li>Organisations with high potential to support communities
                    with the direct and indirect impact of COVID-19</li>
            </ol>
            <p><strong>
                But for all other projects, we want to fund ideas that do
                at least one of these three things:
            </strong></p>
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

            cy: `@TODO: i18n`,
        }),
        minWords: minWords,
        maxWords: maxWords,
        attributes: { rows: 12 },
        messages: [
            {
                type: 'base',
                message: localise({
                    en: `Tell us how your project meets at least one of our funding priorities`,
                    cy: `Dywedwch wrthym sut mae eich prosiect yn cwrdd ag o leiaf un o’n blaenoriaethau ariannu`,
                }),
            },
        ],
    });
};
