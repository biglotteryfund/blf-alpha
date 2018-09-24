'use strict';
const path = require('path');

const { validateIsEmail } = require('../helpers');
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
            return validateIsEmail(formLang, field.name);
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
        isRequired: true
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
