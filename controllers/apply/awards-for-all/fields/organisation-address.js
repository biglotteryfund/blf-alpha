'use strict';
const get = require('lodash/fp/get');

const AddressField = require('../../lib/field-types/address');

module.exports = function(locale) {
    const localise = get(locale);

    return new AddressField({
        locale: locale,
        name: 'organisationAddress',
        label: localise({
            en: `What is the main or registered address of your organisation?`,
            cy: `Beth yw prif gyfeiriad neu gyfeiriad gofrestredig eich sefydliad?`
        }),
        explanation: localise({
            en: `Enter the postcode and search for the address, or enter it manually below.`,
            cy: `Rhowch y cod post a chwiliwch am y cyfeiriad, neu ei deipio isod.`
        })
    });
};
