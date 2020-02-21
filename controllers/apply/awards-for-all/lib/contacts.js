'use strict';
const get = require('lodash/fp/get');
const { safeHtml } = require('common-tags');

function getContactFullName(contactData, html = true) {
    const contactFirstName = get('firstName')(contactData);
    const contactSurname = get('lastName')(contactData);
    if (contactFirstName && contactSurname) {
        if (html) {
            return safeHtml`<strong data-hj-suppress>${contactFirstName} ${contactSurname}</strong>`;
        } else {
            return `${contactFirstName} ${contactSurname}`;
        }
    } else {
        return null;
    }

}

module.exports = {
    getContactFullName
};
