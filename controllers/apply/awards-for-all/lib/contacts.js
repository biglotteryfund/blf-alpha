'use strict';
const get = require('lodash/fp/get');
const { safeHtml } = require('common-tags');

function getContactFullName(data, type) {
    const fieldName =
        type === 'senior' ? 'seniorContactName' : 'mainContactName';
    const contactFirstName = get(`${fieldName}.firstName`)(data);
    const contactSurname = get(`${fieldName}.lastName`)(data);
    const contactName =
        contactFirstName && contactSurname
            ? safeHtml`<strong data-hj-suppress>${contactFirstName} ${contactSurname}</strong>`
            : null;
    return contactName;
}

module.exports = {
    getContactFullName
};
