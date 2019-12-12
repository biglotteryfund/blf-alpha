'use strict';
const get = require('lodash/fp/get');
const { safeHtml } = require('common-tags');

function getContactFullName(contactData) {
    const contactFirstName = get('firstName')(contactData);
    const contactSurname = get('lastName')(contactData);
    const contactName =
        contactFirstName && contactSurname
            ? safeHtml`<strong data-hj-suppress>${contactFirstName} ${contactSurname}</strong>`
            : null;
    return contactName;
}

module.exports = {
    getContactFullName
};
