'use strict';
const get = require('lodash/fp/get');
const Joi = require('../../form-router-next/joi-extensions');

module.exports = function fieldYourIdeaCommunity(locale) {
    const localise = get(locale);

    const minWords = 50;
    const maxWords = 200;

    return {
        name: 'yourIdeaCommunity',
        label: localise({
            en: `How does your project involve your community?`,
            cy: `Sut mae eich prosiect yn cynnwys eich cymuned?`
        }),
        labelDetails: {
            summary: localise({
                en: `What do we mean by community?`,
                cy: `Beth rydym yn ei olygu drwy gymuned?`
            }),
            content: localise({
                en: `<ol>
                    <li>People living in the same area</li>
                    <li>People who have similar interests or life experiences,
                        but might not live in the same area</li>
                    <li>Even though schools can be at the heart of a
                        community—we'll only fund schools that also
                        benefit the communities around them.</li>
                </ol>`,
                cy: `<ol>
                    <li>Pobl yn byw yn yr un ardal</li>
                    <li>Pobl sydd â diddordebau neu brofiadau bywyd tebyg,
                        ond efallai ddim yn byw yn yr un ardal</li>
                    <li>Er gall ysgolion fod wrth wraidd cymuned—byddwn dim ond yn
                        ariannu ysgolion sydd hefyd yn rhoi budd i gymunedau o’u cwmpas.
                    </li>
                </ol>`
            })
        },
        explanation: localise({
            en: `<p>
                We believe that people understand what's needed in their
                communities better than anyone. Tell us how your community 
                came up with the idea for your project. We want to know how
                many people you've spoken to, and how they'll be involved
                in the development and delivery of the project.
            </p>
            <p><strong>Here are some examples of how you could be involving your community:</strong></p>
            <ul>
                <li>Having regular chats with community members, in person or on social media</li>
                <li>Including community members on your board or committee</li>
                <li>Regular surveys</li>
                <li>Setting up steering groups</li>
                <li>Running open days</li>
            </ul>
            <p><strong>
                You can write up to ${maxWords} words for this section,
                but don't worry if you use less.
            </strong></p>`,
            cy: `<p>
                Rydym o’r gred fod pobl yn gwybod yr hyn sydd ei angen yn eu
                cymunedau yn well nag unrhyw un. Dywedwch wrthym sut feddyliodd
                eich cymuned am y syniad i’ch prosiect. Rydym eisiau gwybod
                faint o bobl rydych wedi siarad â nhw, a sut y byddant yn cael
                eu cynnwys yn y datblygiad a’r ddarpariaeth o’r prosiect.
            </p>
            <p><strong>Dyma rhai enghreifftiau o sut gallwch fod yn cynnwys eich cymunedau:</strong></p>
            <ul>
                <li>Cael sgyrsiau rheolaidd ag aelodau’r gymuned, naill ai mewn person neu gyfryngau cymdeithasol</li>
                <li>Cynnwys aelodau o'r gymuned ar eich bwrdd neu bwyllgor</li>
                <li>Arolygon rheolaidd</li>
                <li>Sefydlu grwpiau llywio</li>
                <li>Cynnal diwrnodau agored</li>
            </ul>
            <p><strong>
                Gallwch ysgrifennu hyd at ${maxWords} gair i’r adran hon,
                ond peidiwch â poeni os byddwch yn defnyddio llai.
            </strong></p>`
        }),
        type: 'textarea',
        settings: {
            stackedSummary: true,
            showWordCount: true,
            minWords: minWords,
            maxWords: maxWords
        },
        attributes: { rows: 15 },
        isRequired: true,
        schema: Joi.string()
            .minWords(minWords)
            .maxWords(maxWords)
            .required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: `Tell us how your project involves your community`,
                    cy: `Dywedwch wrthym sut mae eich prosiect yn cynnwys eich cymuned`
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
