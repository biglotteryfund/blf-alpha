'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');
const Field = require('../../lib/field-types/field');

module.exports = function (locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'projectLocationPostcode',
        label: localise({
            en: `What is the postcode of where your project will take place?`,
            cy: `Beth yw côd post lleoliad eich prosiect?`,
        }),
        explanation: localise({
            en: `<p>If your project will take place across different locations,
                please use the postcode where most of the project will take place.</p>
                <p><strong>For example: EC4A 1DE</strong></p>
                <p>If you do not know the postcode, you can use the 
                <a href="https://www.royalmail.com/find-a-postcode" target="_blank">Royal Mail Postcode Finder</a> 
                to try and find it.</p>`,
            cy: ``,
        }),
        attributes: { size: 10, autocomplete: 'postal-code' },
        schema: Joi.string().postcode().required(),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a postcode',
                    cy: 'Rhowch gôd post go iawn',
                }),
            },
        ],
    });
};
