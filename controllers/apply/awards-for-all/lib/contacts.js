'use strict';
const get = require('lodash/fp/get');
const { safeHtml } = require('common-tags');
const { CONTACT_DETAILS_EMAIL, CONTACT_DETAILS_PHONE } = require('../constants');

function getContactFullName(contactData) {
    const contactFirstName = get('firstName')(contactData);
    const contactSurname = get('lastName')(contactData);
    const contactName =
        contactFirstName && contactSurname
            ? safeHtml`<strong data-hj-suppress>${contactFirstName} ${contactSurname}</strong>`
            : null;
    return contactName;
}

function getEmailFor(country) {
    const options = CONTACT_DETAILS_EMAIL;

    return options[country] || options.default;
}

function getPhoneFor(country) {
    const options = CONTACT_DETAILS_PHONE;

    return options[country] || options.default;
}

module.exports = {
    getContactFullName,
    getEmailFor,
    getPhoneFor
};
