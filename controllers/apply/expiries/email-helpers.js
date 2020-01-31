'use strict';

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

module.exports = {
    getSubjectLineForEmail,
    getEditLink
};
