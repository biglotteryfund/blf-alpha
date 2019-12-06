'use strict';
const get = require('lodash/fp/get');

const Field = require('../../lib/field-types/field');

module.exports = function(locale) {
    const localise = get(locale);

    return new Field({
        name: 'projectName',
        label: localise({
            en: 'What is the name of your project?',
            cy: 'Beth yw enw eich prosiect?'
        }),
        explanation: localise({
            en: 'The project name should be simple and to the point',
            cy: 'Dylai enw’r prosiect fod yn syml ac eglur'
        }),
        maxLength: 80,
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a project name',
                    cy: 'Rhowch enw prosiect'
                })
            },
            {
                type: 'string.max',
                message: localise({
                    en: `Project name must be 80 characters or less`,
                    cy: `Rhaid i enw’r prosiect fod yn llai na 80 nod`
                })
            }
        ]
    });
};
