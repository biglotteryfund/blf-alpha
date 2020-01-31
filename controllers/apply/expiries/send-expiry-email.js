'use strict';
const path = require('path');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const get = require('lodash/get');

const {
    EMAIL_EXPIRY_TEST_ADDRESS,
    JWT_SIGNING_TOKEN
} = require('../../../common/secrets');
const appData = require('../../../common/appData');
const { sendHtmlEmail } = require('../../../common/mail');

/**
 * Determine the subject line text for each email type
 * @TODO: Can we vary this on form type and assume the
 *        same cadence for email types, this seems messy?
 */
function getSubjectLineForEmail(emailType) {
    switch (emailType) {
        case 'AFA_ONE_MONTH':
            return {
                en: 'You have one month to finish your application',
                cy: 'Mae gennych fis i orffen eich cais'
            };
        case 'AFA_ONE_WEEK':
            return {
                en: 'You have one week to finish your application',
                cy: 'Mae gennych wythnos i orffen eich cais'
            };
        case 'AFA_ONE_DAY':
            return {
                en: 'You have one day to finish your application',
                cy: 'Mae gennych ddiwrnod i orffen eich cais'
            };
        case 'STANDARD_ONE_MONTH':
            return {
                en: 'You have one month to finish your funding proposal',
                cy: 'Mae gennych fis ar ôl i orffen eich cynnig'
            };
        case 'STANDARD_ONE_WEEK':
            return {
                en: 'You have one week to finish your funding proposal',
                cy: 'Mae gennych wythnos ar ôl i orffen eich cynnig'
            };
        case 'STANDARD_ONE_DAY':
            return {
                en: 'You have one day to finish your funding proposal',
                cy: 'Mae gennych ddiwrnod ar ôl i orffen eich cynnig'
            };
    }
}

/**
 * Generate a link to edit an application,
 * along with a tracking source parameter
 */
function getEditLink(formId, applicationId) {
    const baseUrl = 'https://www.tnlcommunityfund.org.uk/';
    const path = `apply/${
        formId === 'awards-for-all' ? formId : 'your-funding-proposal'
    }/edit/${applicationId}?s=expiryEmail`;

    return {
        en: `${baseUrl}${path}`,
        cy: `${baseUrl}welsh/${path}`
    };
}

function getEmailFor(country) {
    const countryEmail = {
        'scotland': 'advicescotland@tnlcommunityfund.org.uk',
        'northern-ireland': 'enquiries.ni@tnlcommunityfund.org.uk',
        'wales': 'wales@tnlcommunityfund.org.uk'
    }[country];

    return countryEmail || 'general.enquiries@tnlcommunityfund.org.uk';
}

function getPhoneFor(country) {
    const countryPhone = {
        'scotland': '0300 123 7110',
        'northern-ireland': '028 9055 1455',
        'wales': '0300 123 0735'
    }[country];

    return countryPhone || '0345 4 10 20 30';
}

function signUnsubscribeToken(applicationId) {
    return jwt.sign(
        {
            data: {
                applicationId: applicationId,
                action: 'unsubscribe'
            }
        },
        JWT_SIGNING_TOKEN,
        { expiresIn: '30d' }
    );
}

module.exports = function sendExpiryEmail(
    emailToSend,
    mockMailTransport = null
) {
    const formId = emailToSend.PendingApplication.formId;

    function getAppData(field) {
        return get(emailToSend.PendingApplication, `applicationData.${field}`);
    }

    const emailConfig = {
        'awards-for-all': {
            name: 'application_expiry_afa',
            template: path.resolve(
                __dirname,
                './views/awards-for-all-expiry-email.njk'
            )
        },
        'standard-enquiry': {
            name: 'application_expiry_standard',
            template: path.resolve(
                __dirname,
                './views/standard-expiry-email.njk'
            )
        }
    }[formId];

    function getProjectCountry() {
        if (formId === 'awards-for-all') {
            return getAppData('projectCountry');
        } else if (formId === 'standard-enquiry') {
            const countries = getAppData('projectCountries');
            return countries && countries.length === 1
                ? countries[0]
                : 'Multiple';
        }
    }

    function getBilingualStatus() {
        if (formId === 'awards-for-all') {
            return getAppData('projectCountry') === 'wales';
        } else if (formId === 'standard-enquiry') {
            const countries = getAppData('projectCountries');
            return countries && countries.includes('wales');
        }
    }

    const projectCountry = getProjectCountry();
    const isBilingual = getBilingualStatus();

    let subjectLine = getSubjectLineForEmail(emailToSend.emailType);
    // Combine subject lines for bilingual emails
    subjectLine = isBilingual
        ? [subjectLine.en, subjectLine.cy].join(' / ')
        : subjectLine.en;

    const token = signUnsubscribeToken(emailToSend.PendingApplication.id);

    const expiresOn = moment(emailToSend.PendingApplication.expiresAt);

    const dateFormat = 'D MMMM, YYYY HH:mm';
    const expiryDates = {
        en: expiresOn.format(dateFormat),
        cy: expiresOn.locale('cy').format(dateFormat)
    };

    const baseLink = `/apply/emails/unsubscribe?token=${token}`;

    const templateData = {
        isBilingual: isBilingual,
        projectName: getAppData('projectName'),
        countryPhoneNumber: getPhoneFor(projectCountry),
        countryEmail: getEmailFor(projectCountry),
        application: emailToSend.PendingApplication,
        unsubscribeLink: {
            en: `https://tnlcommunityfund.org.uk/${baseLink}`,
            cy: `https://tnlcommunityfund.org.uk/welsh${baseLink}`
        },
        expiryDate: expiryDates,
        editLink: getEditLink(formId, emailToSend.PendingApplication.id)
    };

    return sendHtmlEmail(
        {
            template: emailConfig.template,
            templateData: templateData
        },
        {
            name: emailConfig.name,
            sendTo: appData.isNotProduction
                ? EMAIL_EXPIRY_TEST_ADDRESS
                : emailToSend.PendingApplication.user.username,
            subject: subjectLine
        },
        mockMailTransport
    );
};
