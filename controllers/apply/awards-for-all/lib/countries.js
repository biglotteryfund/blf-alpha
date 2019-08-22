'use strict';
const get = require('lodash/fp/get');
const orderBy = require('lodash/orderBy');

module.exports = function countriesFor({ locale, allowedCountries = [] }) {
    const localise = get(locale);

    function labelForCountry(country) {
        let result = '';
        switch (country) {
            case 'england':
                result = localise({
                    en: 'England',
                    cy: 'Lloegr'
                });
                break;
            case 'scotland':
                result = localise({
                    en: 'Scotland',
                    cy: 'Yr Alban'
                });
                break;
            case 'northern-ireland':
                result = localise({
                    en: 'Northern Ireland',
                    cy: 'Gogledd Iwerddon'
                });
                break;
            case 'wales':
                result = localise({
                    en: 'Wales',
                    cy: 'Cymru'
                });
                break;
        }

        if (allowedCountries.includes(country) === false) {
            result += localise({
                en: ' (coming soon)',
                cy: ' (Dod yn fuan)'
            });
        }

        return result;
    }

    const options = ['england', 'scotland', 'wales', 'northern-ireland'].map(
        country => {
            const option = {
                value: country,
                label: labelForCountry(country)
            };

            if (allowedCountries.includes(country) === false) {
                option.attributes = { disabled: 'disabled' };
            }

            return option;
        }
    );

    return orderBy(options, ['attributes.disabled', 'label'], ['desc', 'asc']);
};
