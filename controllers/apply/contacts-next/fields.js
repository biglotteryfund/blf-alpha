'use strict';
const getOr = require('lodash/fp/getOr');
const fieldAddressHistory = require('./fields/address-history');
const fieldContactCommunicationNeeds = require('./fields/contact-communication-needs');
const fieldContactLanguagePreference = require('./fields/contact-language-preference');
const fieldDateOfBirth = require('./fields/date-of-birth');
const fieldMainContactAddress = require('./fields/main-contact-address');
const fieldMainContactEmail = require('./fields/main-contact-email');
const fieldMainContactName = require('./fields/main-contact-name');
const fieldMainContactPhone = require('./fields/main-contact-phone');
const fieldSeniorContactAddress = require('./fields/senior-contact-address');
const fieldSeniorContactEmail = require('./fields/senior-contact-email');
const fieldSeniorContactName = require('./fields/senior-contact-name');
const fieldSeniorContactPhone = require('./fields/senior-contact-phone');
const fieldSeniorContactRole = require('./fields/senior-contact-role');

module.exports = function fieldsFor({ locale, data = {} }) {
    function formatName(fieldName) {
        const { firstName, lastName } = getOr({}, fieldName)(data);
        return [firstName, lastName].join(' ').trim();
    }

    const seniorContactFullName = formatName('seniorContactName');
    const mainContactFullName = formatName('mainContactName');

    return {
        mainContactName: fieldMainContactName(locale, data),
        mainContactDateOfBirth: fieldDateOfBirth({
            locale: locale,
            name: 'mainContactDateOfBirth',
            minAge: 16,
            contactName: mainContactFullName,
        }),
        mainContactAddress: fieldMainContactAddress({
            locale: locale,
            contactName: mainContactFullName,
        }),
        mainContactAddressHistory: fieldAddressHistory({
            locale: locale,
            name: 'mainContactAddressHistory',
        }),
        mainContactEmail: fieldMainContactEmail(locale),
        mainContactPhone: fieldMainContactPhone(locale),
        mainContactLanguagePreference: fieldContactLanguagePreference({
            locale: locale,
            name: 'mainContactLanguagePreference',
        }),
        mainContactCommunicationNeeds: fieldContactCommunicationNeeds({
            locale: locale,
            name: 'mainContactCommunicationNeeds',
        }),
        seniorContactRole: fieldSeniorContactRole(locale, data),
        seniorContactName: fieldSeniorContactName(locale),
        seniorContactDateOfBirth: fieldDateOfBirth({
            locale: locale,
            name: 'seniorContactDateOfBirth',
            minAge: 18,
            contactName: seniorContactFullName,
        }),
        seniorContactAddress: fieldSeniorContactAddress({
            locale: locale,
            contactName: seniorContactFullName,
        }),
        seniorContactAddressHistory: fieldAddressHistory({
            locale: locale,
            name: 'seniorContactAddressHistory',
        }),
        seniorContactEmail: fieldSeniorContactEmail(locale),
        seniorContactPhone: fieldSeniorContactPhone(locale),
        seniorContactLanguagePreference: fieldContactLanguagePreference({
            locale: locale,
            name: 'seniorContactLanguagePreference',
        }),
        seniorContactCommunicationNeeds: fieldContactCommunicationNeeds({
            locale: locale,
            name: 'seniorContactCommunicationNeeds',
        }),
    };
};
