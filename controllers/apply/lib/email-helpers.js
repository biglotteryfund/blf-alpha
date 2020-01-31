'use strict';

// Determine the subject line text for each email type
// Currently AFA and Standard share subject lines / expiry reminder timings
function getSubjectLineForEmail(emailType) {
    switch (emailType) {
        case 'AFA_ONE_MONTH':
            return {
                en: 'You have one month to finish your application',
                cy: 'Mae gennych fis i orffen eich cais'
            };
        case 'STANDARD_ONE_MONTH':
            return {
                en: 'You have one month to finish your funding proposal',
                cy: '@TODO i18n'
            };
        case 'AFA_ONE_WEEK':
            return {
                en: 'You have one week to finish your application',
                cy: 'Mae gennych wythnos i orffen eich cais'
            };
        case 'STANDARD_ONE_WEEK':
            return {
                en: 'You have one week to finish your funding proposal',
                cy: '@TODO i18n'
            };
        case 'AFA_ONE_DAY':
            return {
                en: 'You have one day to finish your application',
                cy: 'Mae gennych ddiwrnod i orffen eich cais'
            };
        case 'STANDARD_ONE_DAY':
            return {
                en: 'You have one day to finish your funding proposal',
                cy: '@TODO i18n'
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

module.exports = {
    getSubjectLineForEmail,
    getEditLink
};
