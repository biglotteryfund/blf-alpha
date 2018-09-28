'use strict';
const path = require('path');

const { validateIsEmail } = require('../helpers');
const processor = require('./processor');

function buildStrand(strandNumber) {
    const formLang = strandNumber === 1 ? 'apply.digitalFundStrand1' : 'apply.digitalFundStrand2';

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

    const fieldIdea = {
        name: 'your-idea',
        type: 'textarea',
        rows: 12,
        isRequired: true
    };

    const fieldIdeaProduct = {
        name: 'your-idea-product',
        type: 'textarea',
        rows: 12,
        isRequired: true
    };

    const fieldTechnology = {
        name: 'technology',
        type: 'textarea',
        rows: 12,
        isRequired: true
    };

    const step1 = {
        fieldsets: [
            { fields: [fieldName, fieldEmail, fieldOrgName] },
            { fields: strandNumber === 1 ? [fieldIdea] : [fieldIdeaProduct, fieldTechnology] }
        ]
    };

    return {
        id: `digital-fund-strand-${strandNumber}`,
        description: `Digital Fund Strand ${strandNumber}`,
        pageAccent: strandNumber === 1 ? 'blue' : 'cyan',
        shortCode: `DF-STRAND-${strandNumber}`,
        lang: formLang,
        isBilingual: true,
        steps: [step1],
        processor: processor,
        startPage: { urlPath: `/funding/programmes/digital-fund/strand-${strandNumber}` },
        successStep: { template: path.resolve(__dirname, './success') }
    };
}

module.exports = {
    strand1: buildStrand(1),
    strand2: buildStrand(2)
};
