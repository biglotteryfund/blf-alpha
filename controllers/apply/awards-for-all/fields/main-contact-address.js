'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const AddressField = require('../../lib/field-types/address');
const { stripIfExcludedOrgType } = require('../lib/schema-helpers');

module.exports = function(locale) {
    const localise = get(locale);

    return new AddressField({
        locale: locale,
        name: 'mainContactAddress',
        label: localise({
            en: 'Home address',
            cy: 'Cyfeiriad cartref'
        }),
        explanation: localise({
            en: oneLine`We need their home address to help confirm who they are.
                And we do check their address. So make sure you've entered it right.
                If you don't, it could delay your application.`,
            cy: oneLine`Rydym angen eu cyfeiriad cartref i helpu cadarnhau pwy ydynt.
                Ac rydym yn gwirio’r cyfeiriad. Felly sicrhewch eich bod wedi’i
                deipio’n gywir. Os nad ydych, gall oedi eich cais.`
        }),
        schema: stripIfExcludedOrgType(
            Joi.ukAddress()
                .required()
                .compare(Joi.ref('seniorContactAddress'))
        ),
        messages: [
            {
                type: 'object.isEqual',
                message: localise({
                    en: oneLine`Main contact address must be different
                        from the senior contact's address`,
                    cy: oneLine`Rhaid i gyfeiriad y prif gyswllt fod
                        yn wahanol i gyfeiriad yr uwch gyswllt`
                })
            }
        ]
    });
};
