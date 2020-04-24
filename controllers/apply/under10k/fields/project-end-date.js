'use strict';
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

const Joi = require('../../lib/joi-extensions-next');
const DateField = require('../../lib/field-types/date');

const { MAX_PROJECT_DURATION } = require('../constants');

module.exports = function (locale) {
    const localise = get(locale);

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
};
