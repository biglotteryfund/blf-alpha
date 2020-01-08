'use strict';
const get = require('lodash/fp/get');

const Joi = require('../../lib/joi-extensions');
const { CONTACT_EXCLUDED_TYPES } = require('../constants');
const fieldAddress = require('./address');

module.exports = function({ locale, contactName = '' }) {
    const localise = get(locale);

    return fieldAddress(
        locale,
        {
            name: 'mainContactAddress',
            label: localise({
                en: 'Home address',
                cy: 'Cyfeiriad cartref'
            }),
            explanation: localise({
                en: `We need the home address${
                    contactName ? ` for <strong>${contactName}</strong>` : ''
                } to help confirm who they are. And we do check their address. So make sure you've entered it right. If you don't, it could delay your application.`,
                cy: `Rydym angen eu cyfeiriad cartref i helpu cadarnhau pwy ydynt. Ac rydym yn gwirio’r cyfeiriad. Felly sicrhewch eich bod wedi’i deipio’n gywir. Os nad ydych, gall oedi eich cais.`
            }),
            schema: Joi.when(Joi.ref('organisationType'), {
                is: Joi.exist().valid(CONTACT_EXCLUDED_TYPES),
                then: Joi.any().strip(),
                otherwise: Joi.ukAddress()
                    .required()
                    .compare(Joi.ref('seniorContactAddress'))
            })
        },
        [
            {
                type: 'object.isEqual',
                message: localise({
                    en: `Main contact address must be different from the senior contact's address`,
                    cy: `Rhaid i gyfeiriad y prif gyswllt fod yn wahanol i gyfeiriad yr uwch gyswllt`
                })
            }
        ]
    );
};
