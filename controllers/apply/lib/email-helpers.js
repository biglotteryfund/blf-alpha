'use strict';

// Used in the first line of the email, eg:
// "Your National Lottery Awards for All application isn't finished yet"
// "Your funding proposal isn't finished yet"
function getIntroTitle(formId) {
    if (formId === 'awards-for-all') {
        return {
            en:
                'Your National Lottery Awards for All application isn’t finished yet.',
            cy:
                'Nid yw eich cais Arian i Bawb y Loteri Genedlaethol wedi’i gwblhau eto.'
        };
    } else if (formId === 'standard-enquiry') {
        return {
            en: 'Your funding proposal isn’t finished yet.',
            cy: 'Nid yw eich cynnig ariannu wedi’i orffen eto.'
        };
    }
}

// Used at the end of the email to indicate the name of the sender
function getSenderName(formId) {
    if (formId === 'awards-for-all') {
        return {
            en: 'The National Lottery Awards for All Team',
            cy: 'Tîm Arian i Bawb y Loteri Genedlaethol'
        };
    } else if (formId === 'standard-enquiry') {
        return {
            en: 'The National Lottery Community Fund',
            cy: 'Cronfa Gymunedol y Loteri Genedlaethol'
        };
    }
}

// Determine the subject line text for each email type
// Currently AFA and Standard share subject lines / expiry reminder timings
function getSubjectLineForEmail(emailType) {
    let subjectLine = '';
    switch (emailType) {
        case 'AFA_ONE_MONTH':
        case 'STANDARD_ONE_MONTH':
            subjectLine = {
                en: 'You have one month to finish your application',
                cy: 'Mae gennych fis i orffen eich cais'
            };
            break;
        case 'AFA_ONE_WEEK':
        case 'STANDARD_ONE_WEEK':
            subjectLine = {
                en: 'You have one week to finish your application',
                cy: 'Mae gennych wythnos i orffen eich cais'
            };
            break;
        case 'AFA_ONE_DAY':
        case 'STANDARD_ONE_DAY':
            subjectLine = {
                en: 'You have one day to finish your application',
                cy: 'Mae gennych ddiwrnod i orffen eich cais'
            };
            break;
    }
    return subjectLine;
}

// Generate a link to edit an application, along with a tracking source parameter
function getEditLink(formId, applicationId) {
    const baseUrl = 'https://www.tnlcommunityfund.org.uk/';
    const formSlug =
        formId === 'awards-for-all' ? formId : 'your-funding-proposal';
    const path = `apply/${formSlug}/edit/${applicationId}?s=expiryEmail`;
    return {
        en: `${baseUrl}${path}`,
        cy: `${baseUrl}welsh/${path}`
    };
}

module.exports = {
    getIntroTitle,
    getSenderName,
    getSubjectLineForEmail,
    getEditLink
};
