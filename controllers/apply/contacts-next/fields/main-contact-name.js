'use strict';
const compact = require('lodash/compact');
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');
const NameField = require('../../lib/field-types/name');

module.exports = function(locale, data = {}) {
    const localise = get(locale);

    const seniorSurname = get('seniorContactName.lastName')(data);
    const mainSurname = get('mainContactName.lastName')(data);
    const lastNamesMatch = seniorSurname === mainSurname;

    return new NameField({
        locale: locale,
        name: 'mainContactName',
        label: localise({
            en: 'Full name of main contact',
            cy: 'Enw llawn y prif gyswllt'
        }),
        explanation: localise({
            en: 'This person has to live in the UK.',
            cy: 'Rhaid i’r person hwn fyw yn y Deyrnas Unedig.'
        }),
        warnings: compact([
            lastNamesMatch &&
                localise({
                    en: `<span class="js-form-warning-surname">We've noticed that your main and senior contact
                    have the same surname. Remember we can't fund projects
                    where the two contacts are married or related by blood.</span>`,

                    cy: `<span class="js-form-warning-surname">Rydym wedi sylwi bod gan eich uwch gyswllt a’ch
                    prif gyswllt yr un cyfenw. Cofiwch ni allwn ariannu prosiectau
                    lle mae’r ddau gyswllt yn briod neu’n perthyn drwy waed.</span>`
                })
        ]),
        schema: Joi.fullName()
            .compare(Joi.ref('seniorContactName'))
            .required(),
        messages: [
            {
                type: 'object.isEqual',
                message: localise({
                    en: `Main contact name must be different from the senior contact's name`,
                    cy: `Rhaid i enw’r prif gyswllt fod yn wahanol i enw’r uwch gyswllt.`
                })
            }
        ]
    });
};
