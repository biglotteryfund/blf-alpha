'use strict';
const path = require('path');
const { check } = require('express-validator/check');

const processor = require('./processor');

module.exports = strandNumber => {
    const formLang = 'apply.digitalFunding';

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
                .isEmail()
                .withMessage((value, { req }) => {
                    const formCopy = req.i18n.__(formLang);
                    const errorMessage = formCopy.fields[field.name].errorMessage;
                    return req.i18n.__(errorMessage);
                });
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

    const step1 = {
        fieldsets: [
            { fields: [fieldName, fieldEmail, fieldOrgName] },
            { fields: strandNumber === 1 ? [fieldAbout] : [fieldAbout, fieldScale] }
        ]
    };

    return {
        id: `digital-funding-strand-${strandNumber}`,
        pageAccent: strandNumber === 1 ? 'blue' : 'cyan',
        shortCode: `DF-STRAND-${strandNumber}`,
        lang: formLang,
        isBilingual: true,
        steps: [step1],
        processor: processor,
        startPage: { urlPath: `/funding/programmes/digital-funding/strand-${strandNumber}` },
        successStep: { template: path.resolve(__dirname, './success') }
    };
};
