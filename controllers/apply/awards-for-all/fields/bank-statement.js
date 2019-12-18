'use strict';
const get = require('lodash/fp/get');

const FileField = require('../../lib/field-types/file');

module.exports = function(locale) {
    const localise = get(locale);

    return new FileField({
        name: 'bankStatement',
        label: localise({
            en: 'Upload a bank statement',
            cy: 'Uwch lwytho cyfriflen banc'
        }),
        // Used when editing an existing bank statement
        labelExisting: localise({
            en: 'Upload a new bank statement',
            cy: 'Uwch lwytho cyfriflen banc newydd'
        }),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Provide a bank statement',
                    cy: 'Darparwch gyfriflen banc'
                })
            }
        ]
    });
};
