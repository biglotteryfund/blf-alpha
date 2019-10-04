'use strict';

const CONTACT_DETAILS_EMAIL = {
    'default': 'general.enquiries@tnlcommunityfund.org.uk',
    'england': 'afe@tnlcommunityfund.org.uk',
    'scotland': 'advicescotland@tnlcommunityfund.org.uk',
    'northern-ireland': 'enquiries.ni@tnlcommunityfund.org.uk',
    'wales': 'wales@tnlcommunityfund.org.uk'
};

const CONTACT_DETAILS_PHONE = {
    'default': '0345 4 10 20 30',
    'england': '0345 4 10 20 30',
    'scotland': '0300 123 7110',
    'northern-ireland': '028 9055 1455',
    'wales': '0300 123 0735'
};

function getEmailFor(country) {
    const options = CONTACT_DETAILS_EMAIL;
    return options[country] || options.default;
}

function getPhoneFor(country) {
    const options = CONTACT_DETAILS_PHONE;
    return options[country] || options.default;
}

module.exports = {
    getEmailFor,
    getPhoneFor,
    CONTACT_DETAILS_EMAIL,
    CONTACT_DETAILS_PHONE
};
