'use strict';
const get = require('lodash/fp/get');

function getContactFullName(contactData) {
    const contactFirstName = get('firstName')(contactData);
    const contactSurname = get('lastName')(contactData);
    return contactFirstName && contactSurname ? `${contactFirstName} ${contactSurname}` : null;
}

module.exports = {
    getContactFullName
};
