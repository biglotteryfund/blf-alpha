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

            cy: `<p>
                <strong>Os yw'ch prosiect yn gysylltiedig â COVID-19, byddwn yn blaenoriaethu:</strong>
            </p>
            <ol>
                <li>Mudiadau sy'n cefnogi pobl sydd â risg uchel o COVID-19</li>
                <li>Mudiadau sy'n cefnogi cymunedau sydd fwyaf tebygol o wynebu galw a heriau cynyddol o ganlyniad uniongyrchol i COVID-19</li>
                <li>Mudiadau sydd â photensial uchel i gefnogi cymunedau ag effaith uniongyrchol ac anuniongyrchol COVID-19</li>
            </ol>
            <p><strong>
                Ond ar gyfer pob prosiect arall, rydyn ni am ariannu syniadau sy'n gwneud o leiaf un o'r tri pheth hyn:
            </strong></p>
            <ol>
                <li>Dod â phobl ynghyd a meithrin perthnasoedd cryf mewn ac ar draws cymunedau</li>
                <li>Gwella'r lleoedd a'r lleoedd sydd o bwys i gymunedau</li>
                <li>Helpu mwy o bobl i gyrraedd eu potensial, trwy eu cefnogi cyn gynted â phosibl</li>
                </ol>`,
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
