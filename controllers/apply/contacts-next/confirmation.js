'use strict';
const get = require('lodash/fp/get');

module.exports = function({ locale }) {
    const localise = get(locale);

    return {
        title: localise({
            en: `Your application has been submitted. Good luck!`,
            cy: `Mae eich cais wedi’i gyflwyno. Pob lwc!`
        }),
        body: localise({
            en: `<p>Thank you for submitting your application to National Lottery Awards for All.</p>`,
            cy: `<p>Diolch am anfon eich cais i Arian i Bawb y Loteri Genedlaethol.</p>`
        })
    };
};
