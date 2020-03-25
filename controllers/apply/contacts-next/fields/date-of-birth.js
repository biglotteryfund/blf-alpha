'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');
const moment = require('moment');

const Joi = require('../../lib/joi-extensions');
const DateField = require('../../lib/field-types/date');

const { CONTACT_EXCLUDED_TYPES } = require('../constants');

module.exports = function dateOfBirthField({
    locale,
    name,
    minAge,
    contactName,
}) {
    const localise = get(locale);
    const minDate = moment().subtract(120, 'years').format('YYYY-MM-DD');

    const maxDate = moment().subtract(minAge, 'years').format('YYYY-MM-DD');

    return new DateField({
        locale: locale,
        name: name,
        label: localise({ en: 'Date of birth', cy: 'Dyddad geni' }),
        explanation: localise({
            en: `<p>
                We need the date of birth
                ${
                    contactName && contactName !== ''
                        ? ` for <strong>${contactName}</strong>`
                        : ''
                } 
                to help confirm who they are.
                And we do check their date of birth.
                So make sure you've entered it right.
                If you don't, it could delay your application.
            </p>
            <p><strong>For example: 30 03 1980</strong></p>`,

            cy: `<p>
                @TODO i18n
                Rydym angen eu dyddiad geni i helpu cadarnhau pwy ydynt.
                Rydym yn gwirio eu dyddiad geni.
                Felly sicrhewch eich bod wedi ei roi yn gywir.
                Os nad ydych, gall oedi eich cais.
            </p>
            <p><strong>Er enghraifft: 30 03 1980</strong></p>`,
        }),
        attributes: { max: maxDate },
        schema: Joi.when(Joi.ref('organisationType'), {
            is: Joi.exist().valid(CONTACT_EXCLUDED_TYPES),
            then: Joi.any().strip(),
            otherwise: Joi.dateParts()
                .minDate(minDate)
                .maxDate(maxDate)
                .required(),
        }),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a date of birth',
                    cy: 'Rhowch ddyddiad geni',
                }),
            },
            {
                type: 'dateParts.maxDate',
                message: localise({
                    en: `Must be at least ${minAge} years old`,
                    cy: `Rhaid bod yn o leiaf ${minAge} oed`,
                }),
            },
            {
                type: 'dateParts.minDate',
                message: localise({
                    en: oneLine`Their birth date is not valid—please
                            use four digits, eg. 1986`,
                    cy: oneLine`Nid yw’r dyddiad geni yn ddilys—defnyddiwch
                            bedwar digid, e.e. 1986`,
                }),
            },
        ],
    });
};
