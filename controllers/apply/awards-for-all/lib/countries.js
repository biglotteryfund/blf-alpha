'use strict';
const get = require('lodash/fp/get');

module.exports = function countriesFor({ locale, allowedCountries = [] }) {
    const localise = get(locale);

    function labelForCountry(country) {
        let result = '';
        switch (country) {
            case 'england':
                result = localise({
                    en: 'England',
                    cy: ''
                });
                break;
            case 'scotland':
                result = localise({
                    en: 'Scotland',
                    cy: ''
                });
                break;
            case 'northern-ireland':
                result = localise({
                    en: 'Northern Ireland',
                    cy: ''
                });
                break;
            case 'wales':
                result = localise({
                    en: 'Wales',
                    cy: ''
                });
                break;
        }

        if (allowedCountries.includes(country) === false) {
            result += localise({
                en: ' (coming soon)',
                cy: ''
            });
        }

        return result;
    }

    const options = ['scotland', 'england', 'northern-ireland', 'wales'].map(
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

    return options;
};
