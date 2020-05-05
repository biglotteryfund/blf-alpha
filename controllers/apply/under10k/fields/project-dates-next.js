'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions');
const { DateField, RadioField } = require('../../lib/field-types');

function getLeadTimeWeeks(country) {
    const countryLeadTimes = {
        'england': 18,
        'northern-ireland': 12,
        'scotland': 12,
        'wales': 12,
    };

    return countryLeadTimes[country] || 18;
}

module.exports = {
    _getLeadTimeWeeks: getLeadTimeWeeks, // Exported for tests

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

        function schema() {
            /**
             * When projectStartDateCheck is asap
             * we don't show the project start date question
             * and instead pre-fill it with the current date
             * at the point of submission (see forSalesforce())
             */
            return Joi.when('projectStartDateCheck', {
                is: 'asap',
                then: Joi.any().strip(),
                otherwise: Joi.dateParts()
                    .minDate(minDate.format('YYYY-MM-DD'))
                    .required(),
            });
        }

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
            schema: schema(),
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
                        en: oneLine`Date you start the project must be on
                            or after ${minDateExample}`,
                        cy: oneLine`Mae’n rhaid i ddyddiad dechrau eich
                            prosiect fod ar neu ar ôl ${minDateExample}`,
                    }),
                },
            ],
        });
    },
    fieldProjectEndDate(locale, data = {}) {
        const localise = get(locale);

        const projectCountry = get('projectCountry')(data);

        function getMaxDurationMonths() {
            if (projectCountry === 'england') {
                return 6;
            } else {
                return 12;
            }
        }

        function explanation() {
            if (projectCountry === 'england') {
                return localise({
                    en: oneLine`Given the COVID-19 emergency, you can have up to
                        ${getMaxDurationMonths()} months after award to spend the money.
                        It can even be as short as just one day.`,
                    cy: `@TODO: i18n`,
                });
            } else {
                return localise({
                    en: oneLine`You have up to ${getMaxDurationMonths()} months
                        after award to spend the money. It can even be as short
                        as just one day`,
                    cy: `@TODO: i18n`,
                });
            }
        }

        function schema() {
            const maxDate = moment().add(getMaxDurationMonths(), 'months');

            /**
             * When projectStartDateCheck is asap
             * we don't show the project start date question
             * so we allow the end date to be any future date
             * within the max duration for the country.
             *
             * Otherwise we fallback to the default rules where
             * the end date must be within X months of the
             * start date.
             */
            return Joi.when('projectStartDateCheck', {
                is: 'asap',
                then: Joi.dateParts()
                    .minDate(moment().format('YYYY-MM-DD'))
                    .maxDate(maxDate.format('YYYY-MM-DD'))
                    .required(),
                otherwise: Joi.dateParts()
                    .minDateRef(Joi.ref('projectStartDate'))
                    .rangeLimit(Joi.ref('projectStartDate'), {
                        amount: getMaxDurationMonths(),
                        unit: 'months',
                    })
                    .required(),
            });
        }

        return new DateField({
            locale: locale,
            name: 'projectEndDate',
            label: localise({
                en: `When would you have spent the money?`,
                cy: `@TODO: i18n`,
            }),
            explanation: explanation(),
            schema: schema(),
            messages: [
                {
                    type: 'base',
                    message: localise({
                        en: `Enter a project end date`,
                        cy: `Cofnodwch ddyddiad gorffen i’ch prosiect`,
                    }),
                },
                {
                    type: 'dateParts.minDate',
                    message: localise({
                        en: `Date must not be in the past`,
                        cy: `@TODO: i18n`,
                    }),
                },
                {
                    type: 'dateParts.maxDate',
                    message: localise({
                        en: `Date must be no more than ${getMaxDurationMonths()} months away`,
                        cy: `@TODO: i18n`,
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
                        en: oneLine`Date must be within
                        ${getMaxDurationMonths()} months of the start date.`,
                        cy: oneLine`Rhaid i ddyddiad gorffen y prosiect fod o fewn
                        ${getMaxDurationMonths()} mis o ddyddiad dechrau’r prosiect.`,
                    }),
                },
            ],
        });
    },
};
