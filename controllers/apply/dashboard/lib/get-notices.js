'use strict';
const moment = require('moment');
const { oneLine } = require('common-tags');
const get = require('lodash/fp/get');

module.exports = function getNotices(locale, pendingApplications = []) {
    const localise = get(locale);

    function showEnglandPrioritiesNotice() {
        // Only show notice for applications created before this date
        const cutoffDate = '2020-05-12';
        return pendingApplications.some(function (application) {
            return (
                application.formId === 'awards-for-all' &&
                get('applicationData.projectCountry')(application) ===
                    'england' &&
                moment(application.createdAt).isBefore(cutoffDate)
            );
        });
    }

    const notices = [];
    if (showEnglandPrioritiesNotice()) {
        notices.push({
            title: localise({
                en: oneLine`For funding under £10,000 in England, we're now only
                    accepting COVID-19 related applications`,
                cy: oneLine`Ar gyfer ariannu o dan £10,000 yn Lloegr, dim ond
                    ceisiadau cysylltiedig â COVID-19 yr ydym yn eu derbyn`,
            }),
            body: localise({
                en: oneLine`If you've started an application already,
                    and it's not related to supporting your community
                    or organisation through the pandemic, we won't be
                    able to accept it. But you could decide to start
                    a new one that focuses on COVID-19 instead.`,
                cy: oneLine`Os ydych chi wedi cychwyn cais yn barod,
                    ac nad yw'n gysylltiedig â chefnogi'ch cymuned
                    neu sefydliad trwy'r pandemig, ni fyddwn yn gallu
                    ei dderbyn. Ond fe allech chi benderfynu cychwyn
                    un newydd sy'n canolbwyntio ar COVID-19 yn lle.`,
            }),
        });
    }

    return notices;
};
