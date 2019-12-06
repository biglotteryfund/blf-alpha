'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Field = require('../../lib/field-types/field');
const { FREE_TEXT_MAXLENGTH } = require('../constants');

module.exports = function(locale) {
    const localise = get(locale);

    return new Field({
        name: 'organisationLegalName',
        label: localise({
            en: `What is the full legal name of your organisation?`,
            cy: `Beth yw enw cyfreithiol llawn eich sefydliad?`
        }),
        explanation: localise({
            en: `<p>
                This must be as shown on your <strong>governing document</strong>.
                Your governing document could be called one of several things,
                depending on the type of organisation you're applying on behalf of.
                It may be called a constitution, trust deed, memorandum and
                articles of association, or something else entirely.
            </p>`,

            cy: `<p>
                Rhaid i hwn fod fel y dangosir ar eich <strong>dogfen lywodraethol</strong>.
                Gall eich dogfen lywodraethol gael ei alw yn un o amryw o bethau,
                gan ddibynnu ar y math o sefydliad rydych yn ymgeisio ar ei rhan.
                Gall gael ei alw’n gyfansoddiad, gweithred ymddiriedaeth,
                memorandwm ac erthyglau cymdeithas, neu rywbeth gwbl wahanol. 
            </p>`
        }),
        maxLength: FREE_TEXT_MAXLENGTH.large,
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter the full legal name of the organisation',
                    cy: 'Rhowch enw cyfreithiol llawn eich sefydliad'
                })
            },
            {
                type: 'string.max',
                message: localise({
                    en: oneLine`Full legal name of organisation must be
                        ${FREE_TEXT_MAXLENGTH.large} characters or less`,
                    cy: oneLine`Rhaid i’r enw cyfreithiol llawn fod yn llai na
                        ${FREE_TEXT_MAXLENGTH.large} nod`
                })
            }
        ]
    });
};
