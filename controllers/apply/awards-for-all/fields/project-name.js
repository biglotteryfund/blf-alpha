'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Field = require('../../lib/field-types/field');
const { FREE_TEXT_MAXLENGTH } = require('../constants');

module.exports = function (locale) {
    const localise = get(locale);

    return new Field({
        locale: locale,
        name: 'projectName',
        label: localise({
            en: 'What is the name of your project?',
            cy: 'Beth yw enw eich prosiect?',
        }),
        explanation: localise({
            en: 'The project name should be simple and to the point',
            cy: 'Dylai enw’r prosiect fod yn syml ac eglur',
        }),
        maxLength: FREE_TEXT_MAXLENGTH.medium,
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a project name',
                    cy: 'Rhowch enw prosiect',
                }),
            },
            {
                type: 'string.max',
                message: localise({
                    en: oneLine`Project name must be
                        ${FREE_TEXT_MAXLENGTH.medium} characters or less`,
                    cy: oneLine`Rhaid i enw’r prosiect fod yn llai na
                        ${FREE_TEXT_MAXLENGTH.medium} nod`,
                }),
            },
        ],
    });
};
