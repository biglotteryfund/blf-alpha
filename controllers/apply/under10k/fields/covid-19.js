'use strict';
const get = require('lodash/fp/get');
const { oneLine, stripIndents } = require('common-tags');

const { RadioField } = require('../../lib/field-types');

module.exports = {
    fieldSupportingCOVID19(locale) {
        const localise = get(locale);

        return new RadioField({
            locale: locale,
            name: 'supportingCOVID19',
            label: localise({
                en: oneLine`Is your project supporting people
                    affected by the COVID-19 crisis?`,
                cy: `@TODO: i18n`,
            }),
            explanation: localise({
                en: stripIndents`<p>
                    We will prioritise:
                </p>
                <ul>
                    <li>
                        organisations supporting people who are
                        at high risk from COVID-19
                    </li>
                    <li>
                        organisation supporting people most likely
                        to face increased demand and challenges as
                        a result of the COVID-19 crisis
                    </li>
                    <li>
                        organisations which connect communities
                        and support communities to work together
                        to respond to COVID-19.
                    </li>
                </ul>`,

                cy: stripIndents`@TODO: i18n`,
            }),
            options: [
                {
                    value: 'yes',
                    label: localise({ en: `Yes`, cy: `Ydi` }),
                },
                {
                    value: 'no',
                    label: localise({ en: `No`, cy: `Nac ydi` }),
                },
            ],
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: 'Select an option',
                        cy: 'Dewis opsiwn',
                    }),
                },
            ],
        });
    },
};
