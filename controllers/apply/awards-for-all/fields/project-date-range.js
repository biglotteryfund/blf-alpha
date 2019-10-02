'use strict';
const get = require('lodash/fp/get');
const moment = require('moment');
const { oneLine } = require('common-tags');

const { MAX_PROJECT_DURATION, MIN_START_DATE } = require('../constants');
const Joi = require('../../lib/joi-extensions');

module.exports = function(locale) {
    const localise = get(locale);

    const minDate = moment().add(
        MIN_START_DATE.amount,
        MIN_START_DATE.unit
    );

    function formatAfterDate() {
        return minDate
            .clone()
            .subtract(1, 'days')
            .locale(locale)
            .format('D MMMM YYYY');
    }

    return {
        name: 'projectDateRange',
        label: localise({
            en: `When would you like to start and end your project?`,
            cy: `Pryd yr hoffech ddechrau a gorffen eich prosiect?`
        }),
        settings: {
            minYear: minDate.format('YYYY')
        },
        explanation: localise({
            en: `<p>
                If you don't know exactly, your dates can be estimates.
                But you need to start your project after
                ${formatAfterDate()}.
            </p>
            <p>
                We usually only fund projects that last
                ${localise(MAX_PROJECT_DURATION.label)} or less.
                So, the end date can't be more than
                ${localise(
                    MAX_PROJECT_DURATION.label
                )} after the start date.    
            </p>
            <p><strong>If your project is a one-off event</strong></p>
            <p>
                Just let us know the date you plan to hold the event
                in the start and end date boxes below.
            </p>`,

            cy: `<p>
                Os nad ydych yn gwybod yn union, gall eich dyddiadau fod yn amcangyfrifon.
                Ond mae angen i chi ddechrau eich prosiect ar ôl 
                ${formatAfterDate()}.
            </p>
            <p>
                Fel arfer, dim ond prosiectau sy’n para 
                ${localise(
                    MAX_PROJECT_DURATION.label
                )} neu lai rydym yn eu hariannu.
                Felly, ni all y dyddiad gorffen fod yn hwyrach na 
                ${localise(
                    MAX_PROJECT_DURATION.label
                )} wedi’r dyddiad cychwyn.    
            </p>
            <p><strong>Os yw eich prosiect yn ddigwyddiad sy’n digwydd unwaith yn unig</strong></p>
            <p>
                Gadewch i ni wybod y dyddiad rydych yn bwriadu cynnal y
                digwyddiad yn y bocsys dyddiad dechrau a gorffen isod. 
            </p>`
        }),
        type: 'date-range',
        isRequired: true,
        schema: Joi.dateRange()
            .minDate(minDate.format('YYYY-MM-DD'))
            .endDateLimit(
                MAX_PROJECT_DURATION.amount,
                MAX_PROJECT_DURATION.unit
            ),
        messages: [
            {
                type: 'base',
                message: localise({
                    en: 'Enter a project start and end date',
                    cy: 'Rhowch ddyddiad dechrau a gorffen y prosiect'
                })
            },
            {
                type: 'dateRange.both.invalid',
                message: localise({
                    en: `Project start and end dates must be real dates`,
                    cy: `Rhaid i ddyddiadau dechrau a gorffen y prosiect fod yn rhai go iawn`
                })
            },
            {
                type: 'datesRange.startDate.invalid',
                message: localise({
                    en: `Date you start the project must be a real date`,
                    cy: `Rhaid i ddyddiad dechrau’r prosiect fod yn un go iawn`
                })
            },
            {
                type: 'dateRange.endDate.invalid',
                message: localise({
                    en: 'Date you end the project must be a real date',
                    cy: `Rhaid i ddyddiad gorffen y prosiect fod yn un go iawn`
                })
            },
            {
                type: 'dateRange.minDate.invalid',
                message: localise({
                    en: `Date you start the project must be after ${formatAfterDate()}`,
                    cy: `Rhaid i ddyddiad dechrau’r prosiect fod ar ôl ${formatAfterDate()}`
                })
            },
            {
                type: 'dateRange.endDate.outsideLimit',
                message: localise({
                    en: oneLine`Date you end the project must be within
                        ${localise(
                            MAX_PROJECT_DURATION.label
                        )} of the start date.`,
                    cy: oneLine`Rhaid i ddyddiad gorffen y prosiect fod o fewn
                        ${localise(
                            MAX_PROJECT_DURATION.label
                        )} o ddyddiad dechrau’r prosiect.`
                })
            },
            {
                type: 'dateRange.endDate.beforeStartDate',
                message: localise({
                    en: `Date you end the project must be after the start date`,
                    cy: `Rhaid i ddyddiad gorffen y prosiect fod ar ôl y dyddiad dechrau`
                })
            }
        ]
    };
};
