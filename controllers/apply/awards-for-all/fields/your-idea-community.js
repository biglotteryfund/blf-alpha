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
                cy: ``
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
                cy: ``
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
            cy: ''
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
                    cy: ``
                })
            },
            {
                type: 'string.minWords',
                message: localise({
                    en: `Answer must be at least ${minWords} words`,
                    cy: ''
                })
            },
            {
                type: 'string.maxWords',
                message: localise({
                    en: `Answer must be no more than ${maxWords} words`,
                    cy: ''
                })
            }
        ]
    };
};
