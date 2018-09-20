'use strict';
const path = require('path');
const { check } = require('express-validator/check');

const processor = require('./processor');

const fieldName = {
    type: 'text',
    name: 'name',
    autocompleteName: 'name',
    isRequired: true
};

const fieldEmail = {
    type: 'email',
    name: 'email',
    autocompleteName: 'email',
    isRequired: true,
    validator: function(field) {
        return check(field.name)
            .trim()
            .not()
            .isEmpty()
            .isEmail()
            .withMessage('Please provide a valid email address');
    }
};

const fieldOrgName = {
    type: 'text',
    name: 'organisation-name',
    isRequired: true
};

const fieldAbout = {
    name: 'about-your-organisation',
    type: 'textarea',
    rows: 12,
    isRequired: true
};

const fieldScale = {
    name: 'how-technology-helps-scale',
    type: 'textarea',
    rows: 12,
    isRequired: true,
    label: 'Briefly tell us how technology helps you scale your impact',
    lengthHint: 'Please keep it to a couple of paragraphs'
};

module.exports = strandNumber => {
    const step1 = {
        fieldsets: [
            { fields: [fieldName, fieldEmail, fieldOrgName] },
            { fields: strandNumber === 1 ? [fieldAbout] : [fieldAbout, fieldScale] }
        ]
    };

    return {
        id: `digital-funding-strand-${strandNumber}`,
        lang: 'apply.digitalFunding',
        pageAccent: strandNumber === 1 ? 'blue' : 'cyan',
        shortCode: `DF-STRAND-${strandNumber}`,
        isBilingual: true,
        steps: [step1],
        processor: processor,
        startPage: { urlPath: `/funding/programmes/digital-funding/strand-${strandNumber}` },
        successStep: { template: path.resolve(__dirname, './success') }
    };
};
