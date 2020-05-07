'use strict';
const config = require('config');
const get = require('lodash/fp/get');
const { oneLine } = require('common-tags');

module.exports = function getNotice(locale, pendingApplications = []) {
    const localise = get(locale);
    const hasPendingEngland = pendingApplications.some(function (application) {
        return (
            application.formId === 'awards-for-all' &&
            get('applicationData.projectCountry')(application) === 'england'
        );
    });

    if (
        config.get('fundingUnder10k.enableNewCOVID19Flow') &&
        hasPendingEngland
    ) {
        return {
            title: localise({
                en: oneLine`For funding under £10,000 in England, we're now only
                    accepting COVID-19 related applications`,
                cy: `@TODO: i18n`,
            }),
            body: localise({
                en: oneLine`If you've started an application already,
                    and it's not related to supporting your community
                    or organisation through the pandemic, we won't be
                    able to accept it. But you could decide to start
                    a new one that focuses on COVID-19 instead.`,
                cy: `@TODO: i18n`,
            }),
        };
    }
};
