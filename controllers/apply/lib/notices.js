'use strict';
const config = require('config');
const moment = require('moment');
const { oneLine } = require('common-tags');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');

const enableGovCOVIDUpdates = config.get(
    'fundingUnder10k.enableGovCOVIDUpdates'
);

const enableStandardEnglandAutoProjectDuration = config.get(
    'standardFundingProposal.enableEnglandAutoProjectDuration'
);
const { enableStandardV2, enableSimpleV2 } = require('../../../common/secrets');
const bannersLaunch = config.get('standardFundingProposal.banners');

module.exports = {
    getNoticesAll(locale, pendingApplications = []) {
        const localise = get(locale);

        function showEnglandPrioritiesNotice() {
            // Only show notice for applications created before this date
            // @TODO this can be removed after 2020-08-12 as any applications
            // which were created before this will have expired
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
                    able to fund it. But you could decide to start
                    a new one that focuses on COVID-19 instead.`,
                    cy: oneLine`Os ydych chi wedi cychwyn cais yn barod,
                    ac nad yw'n gysylltiedig â chefnogi'ch cymuned
                    neu sefydliad trwy'r pandemig, ni fyddwn yn gallu
                    ei dderbyn. Ond fe allech chi benderfynu cychwyn
                    un newydd sy'n canolbwyntio ar COVID-19 yn lle.`,
                }),
            });

            if (enableGovCOVIDUpdates) {
                notices.push({
                    title: oneLine`We've also changed our eligibility
                        criteria to help communities through the pandemic`,
                    body: oneLine`So in England we're only funding voluntary
                        and community organisations for the time being.`,
                });
            }
        }

        function showFormChangesNotice() {
            // Only show notice for applications created before this date
            // which were created before this will have expired
            const goLiveDate = '2020-11-16';
            return pendingApplications.some(function (application) {
                return moment(application.createdAt).isBefore(goLiveDate);
            });
        }

        if (bannersLaunch && showFormChangesNotice()) {
            if (enableStandardV2) {
                notices.push({
                    title: localise({
                        en: oneLine`We’ve made changes to our online application forms`,
                        cy: oneLine`Rydym wedi gwneud newidiadau i'n ffurflenni cais ar-lein`,
                    }),
                    body: localise({
                        en: `<p>We hope to improve the experience of applying for funding. These 
                        changes might mean you have to answer more questions or change your answers 
                        before submitting your application. But we have given you an extra two weeks 
                        to complete your application if your application was close to expiring when 
                        we made the changes.</p>`,
                        cy: `<p>Gobeithiwn wella'r profiad o wneud cais am grant. Gallai'r newidiadau 
                        hyn olygu bod yn rhaid i chi ateb mwy o gwestiynau neu newid eich atebion cyn 
                        cyflwyno'ch cais. Ond rydym wedi rhoi pythefnos ychwanegol i chi gwblhau eich 
                        cais os oedd eich cais yn agos at ddod i ben pan wnaethom y newidiadau.</p>`,
                    }),
                });
            } else {
                notices.push({
                    title: localise({
                        en: oneLine`We’re going to make changes to our online application forms soon`,
                        cy: oneLine`Rydym am wneud newidiadau i’n ffurflenni cais ar-lein yn fuan`,
                    }),
                    body: localise({
                        en: `<p>We hope to improve the experience of applying for funding. These changes 
                        might mean you have to answer more questions or change your answers before 
                        submitting your application. But we'll give you an extra two weeks to complete 
                        your application if your application is close to expiring.</p>`,
                        cy: `<p>Gobeithiwn wella'r profiad o wneud cais am grant. Gallai'r newidiadau hyn 
                        olygu bod yn rhaid i chi ateb mwy o gwestiynau neu newid eich atebion cyn 
                        cyflwyno'ch cais. Ond byddwn yn rhoi pythefnos ychwanegol i chi gwblhau eich 
                        cais os yw eich cais yn agos at ddod i ben.</p>`,
                    }),
                });
            }
        }

        return notices;
    },
    getNoticesSingle(locale, application = []) {
        const localise = get(locale);
        const isEnglandStatutory =
            application.formId === 'awards-for-all' &&
            get('applicationData.projectCountry')(application) === 'england' &&
            ['school', 'college-or-university', 'statutory-body'].includes(
                get('applicationData.organisationType')(application)
            ) === true;

        /*
         * Only show notice for applications created before this date
         * when the projectDurationYears field was removed for England apps
         * @TODO this can be removed after 2020-09-04 as any applications
         * which were created before this will have expired
         */
        const projectDurationCutoffDate = '2020-06-04';
        const isStandard = application.formId === 'standard-enquiry';
        const isSimple = application.formId === 'awards-for-all';
        const isEnglandStandard =
            application.formId === 'standard-enquiry' &&
            getOr(
                [],
                'applicationData.projectCountries'
            )(application).includes('england') &&
            moment(application.createdAt).isBefore(projectDurationCutoffDate);

        const notices = [];

        if (enableGovCOVIDUpdates && isEnglandStatutory) {
            notices.push({
                title: `We're sorry, but your application is now not eligible for funding`,
                body: oneLine`We've changed our eligibility criteria
                    (for the time being) to help communities through
                    the pandemic. So for funding under £10,000,
                    we're only funding voluntary and community
                    organisations with COVID-19 related projects.`,
            });
        }

        if (enableStandardEnglandAutoProjectDuration && isEnglandStandard) {
            notices.push(
                {
                    title: oneLine`For funding over £10,000 in England, we're 
                        now only accepting COVID-19 related applications`,
                    body: oneLine`If you've started an application already, and 
                        it's not related to supporting your community or 
                        organisation through the pandemic, we won't be able to 
                        fund it. But you could decide to start a new one that 
                        focuses on COVID-19 instead.`,
                },
                {
                    title: oneLine`We've also changed our eligibility criteria 
                        to help communities through the pandemic`,
                    body: oneLine`So in England we're only funding voluntary and 
                        community organisations for the time being. And we can 
                        generally only award a maximum of £100,000 for up to 
                        six months.`,
                }
            );
        }

        function showFormChangesNotice(formId) {
            // Only show notice for applications created before this date
            // which were created before this will have expired
            const goLiveDate = '2020-11-16';
            return (
                application.formId === formId &&
                moment(application.createdAt).isBefore(goLiveDate)
            );
        }

        if (bannersLaunch) {
            if (isStandard && showFormChangesNotice('standard-enquiry')) {
                if (enableStandardV2) {
                    notices.push({
                        title: localise({
                            en: oneLine`We’ve made changes to this online application form`,
                            cy: oneLine`Rydym wedi gwneud newidiadau i'r ffurflen gais ar-lein hon`,
                        }),
                        body: localise({
                            en: `<p>We hope these improve the experience of applying for funding. These changes might 
                                  mean you have to answer more questions or change your answers before submitting your 
                                  application. This includes where you tell us what 
                                  <a href="/apply/your-funding-proposal-v2/your-project/8?edit#form-field-yourIdeaProject">your project</a> 
                                   is about. But we’ve highlighted new questions to you, and given you an extra two 
                                   weeks to complete your application if your application is close to expiring. Read 
                                   about our 
                                  <a href="/funding/over10k">over £10,000</a> to find out more about what's changed.</p>`,
                            cy: `<p>Gobeithiwn y bydd y rhain yn gwella'r profiad o wneud cais am grant. Gallai'r 
                            newidiadau hyn olygu bod yn rhaid i chi ateb mwy o gwestiynau neu newid eich atebion cyn 
                            cyflwyno'ch cais. Mae hyn yn cynnwys ble rydych chi'n dweud wrthym beth yw 
                            <a href="/apply/your-funding-proposal-v2/your-project/8?edit#form-field-yourIdeaProject">eich prosiect</a>
                            . Ond rydym wedi tynnu ei sylw atoch, ac wedi rhoi pythefnos ychwanegol i chi gwblhau eich 
                            cais os yw eich cais yn agos at ddod i ben. Darllenwch am ein 
                            <a href="/welsh/funding/over10k">grantiau dros £10,000</a> i gael gwybod mwy am yr hyn sydd 
                            wedi newid.</p>`,
                        }),
                    });
                } else {
                    notices.push({
                        title: localise({
                            en: oneLine`We’re going to make changes to this online application form soon`,
                            cy: oneLine`Rydym yn mynd i wneud newidiadau i'r ffurflen gais ar-lein hon yn fuan`,
                        }),
                        body: localise({
                            en: `<p>We hope to improve the experience of applying for funding. These changes 
                            will might mean you have to answer more questions or change your answers before submitting 
                            your application. But we will give you an extra two weeks to complete your application if 
                            your application is close to expiring. You can also wait until we’ve made the changes and 
                            then start a new application.</p>`,
                            cy: `<p>Gobeithiwn wella'r profiad o wneud cais am grant. Gallai'r newidiadau hyn olygu bod 
                            yn rhaid i chi ateb mwy o gwestiynau neu newid eich atebion cyn cyflwyno'ch cais. Ond byddwn 
                            yn rhoi pythefnos ychwanegol i chi gwblhau eich cais os yw eich cais yn agos at ddod i ben. 
                            Gallwch hefyd aros nes ein bod wedi gwneud y newidiadau ac yna dechrau cais newydd.</p>`,
                        }),
                    });
                }
            } else if (isSimple && showFormChangesNotice('awards-for-all')) {
                if (enableSimpleV2) {
                    notices.push({
                        title: localise({
                            en: oneLine`We’ve made changes to this online application form`,
                            cy: oneLine`Rydym wedi gwneud newidiadau i'r ffurflen gais ar-lein hon`,
                        }),
                        body: localise({
                            en: `<p>We hope these improve the experience of applying for funding. These 
                            changes might mean you have to answer more questions or change your answers before 
                            submitting your application. But we have given you an extra two weeks to complete 
                            your application if your application is close to expiring. Have a look at our website 
                            for the latest information about funding 
                                  <a href="/funding/under10k">under £10,000</a>.</p>`,
                            cy: `<p>Gobeithiwn y bydd y rhain yn gwella'r profiad o wneud cais am grant. Gallai'r 
                            newidiadau hyn olygu bod yn rhaid i chi ateb mwy o gwestiynau neu newid eich atebion 
                            cyn cyflwyno'ch cais. Ond rydym wedi rhoi pythefnos ychwanegol i chi gwblhau eich cais 
                            os yw eich cais yn agos at ddod i ben. Edrychwch ar ein gwefan am y wybodaeth ddiweddaraf 
                            am grantiau 
                            <a href="/welsh/funding/under10k">dan £10,000</a>.</p>`,
                        }),
                    });
                } else {
                    notices.push({
                        title: localise({
                            en: oneLine`We’re going to make changes to this online application form soon`,
                            cy: oneLine`Rydym yn mynd i wneud newidiadau i'r ffurflen gais ar-lein hon yn fuan`,
                        }),
                        body: localise({
                            en: `<p>We hope to improve the experience of applying for funding. These changes might 
                        mean you have to answer more questions or change your answers before submitting your application. 
                        But we'll give you an extra two weeks to complete your application if your application is close 
                        to expiring. You can also wait until we’ve made the changes and then start a new application.</p>`,
                            cy: `<p>Gobeithiwn wella'r profiad o wneud cais am grant. Gallai'r newidiadau hyn olygu bod 
                            yn rhaid i chi ateb mwy o gwestiynau neu newid eich atebion cyn cyflwyno'ch cais. Ond byddwn 
                            yn rhoi pythefnos ychwanegol i chi gwblhau eich cais os yw eich cais yn agos at ddod i ben. 
                            Gallwch hefyd aros nes ein bod wedi gwneud y newidiadau ac yna dechrau cais newydd.</p>`,
                        }),
                    });
                }
            } else if (enableStandardV2) {
                notices.push({
                    title: localise({
                        en: oneLine`We’ve made some changes to our application form`,
                        cy: oneLine`Rydym yn mynd i wneud newidiadau i'r ffurflen gais ar-lein hon yn fuan`,
                    }),
                    body: localise({
                        en: `<p>We hope these improve the experience of applying for funding. These changes 
                        might mean you have to answer more questions and may want to change any answers you 
                        might have prepared.</p>`,
                        cy: `<p>Gobeithiwn y bydd y rhain yn gwella'r profiad o wneud cais am grant. Gallai'r 
                        newidiadau hyn olygu bod yn rhaid i chi ateb mwy o gwestiynau ac efallai y byddwch am 
                        newid unrhyw atebion y gallech fod wedi'u paratoi.</p>`,
                    }),
                });
            }
        }

        return notices;
    },
};
