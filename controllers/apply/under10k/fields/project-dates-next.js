'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const { DateField, RadioField } = require('../../lib/field-types');

const getLeadTimeWeeks = require('../lib/lead-time');

module.exports = {
    fieldProjectStartDateCheck(locale, data = {}) {
        const localise = get(locale);

        const projectCountry = get('projectCountry')(data);
        const supportingCOVID19 = get('supportingCOVID19')(data);

        function options() {
            const optionAsap = {
                value: 'asap',
                label: localise({
                    en: `As soon as possible`,
                    cy: `@TODO: i18n`,
                }),
            };

            const optionExactDate = {
                value: 'exact-date',
                label: localise({
                    en: `Enter an exact date`,
                    cy: `@TODO: i18n`,
                }),
            };

            if (projectCountry === 'england' || supportingCOVID19 === 'yes') {
                optionExactDate.attributes = { disabled: 'disabled' };
            }

            return [optionAsap, optionExactDate];
        }

        return new RadioField({
            locale: locale,
            name: 'projectStartDateCheck',
            label: localise({
                en: `When would you like to get the money if you are awarded?`,
                cy: `@TODO: i18n`,
            }),
            options: options(),
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
    fieldProjectStartDate(locale, data) {
        const localise = get(locale);

        const projectCountry = get('projectCountry')(data);
        const minDate = moment().add(getLeadTimeWeeks(projectCountry), 'weeks');

        const minDateExample = minDate
            .clone()
            .locale(locale)
            .format('DD MM YYYY');

        return new DateField({
            locale: locale,
            name: 'projectStartDate',
            label: localise({
                en: `Tell us when you'd like to get the money if you're awarded funding?`,
                cy: `@TODO: i18n`,
            }),
            explanation: localise({
                en: oneLine`Don't worry, this can be an estimate. 
                But most projects must usually start on or after
                <strong>${minDateExample}</strong>.`,
                cy: oneLine`Peidiwch â phoeni, gall hwn fod yn amcangyfrif. 
                Ond fel rheol mae'n rhaid i'r mwyafrif o brosiectau ddechrau ar 
                neu ar ôl <strong>${minDateExample}</strong>.`,
            }),
            settings: {
                minYear: minDate.format('YYYY'),
            },
            schema: Joi.dateParts()
                .minDate(minDate.format('YYYY-MM-DD'))
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter a project start date`,
                        cy: `Cofnodwch ddyddiad dechrau i’ch prosiect`,
                    }),
                },
                {
                    type: 'dateParts.minDate',
                    message: localise({
                        en: oneLine`Date you start the project must be on or after
                        ${minDateExample}`,
                        cy: oneLine`Mae’n rhaid i ddyddiad dechrau eich prosiect
                        fod ar neu ar ôl ${minDateExample}`,
                    }),
                },
            ],
        });
    },
    fieldProjectEndDate(locale) {
        const localise = get(locale);

        const MAX_PROJECT_DURATION = {
            amount: 15,
            unit: 'months',
            label: { en: '15 months', cy: '15 mis' },
        };

        return new DateField({
            locale: locale,
            name: 'projectEndDate',
            label: localise({
                en: `When would you like to finish your project?`,
                cy: `Pryd hoffech orffen eich prosiect?`,
            }),
            explanation: localise({
                en: oneLine`Your project can finish up to 12 months after it starts.
                It can even be as short as just one day`,
                cy: oneLine`Gall eich prosiect orffen hyd at 12 mis wedi iddo gychwyn.
                Gall fod mor fyr ag un diwrnod yn unig.`,
            }),
            schema: Joi.dateParts()
                .minDateRef(Joi.ref('projectStartDate'))
                .rangeLimit(Joi.ref('projectStartDate'), {
                    amount: MAX_PROJECT_DURATION.amount,
                    unit: MAX_PROJECT_DURATION.unit,
                })
                .required(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter a project end date`,
                        cy: `Cofnodwch ddyddiad gorffen i’ch prosiect`,
                    }),
                },
                {
                    type: 'dateParts.minDateRef',
                    message: localise({
                        en: `Date you end the project must be after the start date`,
                        cy: `Rhaid i ddyddiad gorffen y prosiect fod ar ôl y dyddiad dechrau`,
                    }),
                },
                {
                    type: 'dateParts.rangeLimit',
                    message: localise({
                        en: oneLine`Date you end the project must be within
                        ${localise(MAX_PROJECT_DURATION.label)}
                        of the start date.`,
                        cy: oneLine`Rhaid i ddyddiad gorffen y prosiect fod o fewn
                        ${localise(MAX_PROJECT_DURATION.label)}
                        o ddyddiad dechrau’r prosiect.`,
                    }),
                },
            ],
        });
    },
};
