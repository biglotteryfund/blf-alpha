'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const get = require('lodash/get');
const groupBy = require('lodash/groupBy');
const maxBy = require('lodash/maxBy');
const mean = require('lodash/mean');
const minBy = require('lodash/minBy');
const sum = require('lodash/sum');
const times = require('lodash/times');
const uniqBy = require('lodash/uniqBy');

const {
    PendingApplication,
    SubmittedApplication,
    Feedback
} = require('../../db/models');
const { DATA_STUDIO_AFA_URL } = require('../../common/secrets');

const getDateRange = require('./lib/get-date-range');

const awardsForAllFormBuilder = require('../apply/awards-for-all/form');
const standardProposalFormBuilder = require('../apply/standard-proposal/form');

const router = express.Router();

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? standardProposalFormBuilder
        : awardsForAllFormBuilder;
}

function applicationsByDay(responses) {
    if (responses.length === 0) {
        return [];
    }

    const grouped = groupBy(responses, function(response) {
        return moment(response.createdAt).format('YYYY-MM-DD');
    });

    const newestResponse = maxBy(responses, response => response.createdAt);
    const oldestResponse = minBy(responses, response => response.createdAt);
    const oldestResponseDate = moment(oldestResponse.createdAt);

    const daysInRange = moment(newestResponse.createdAt)
        .startOf('day')
        .diff(oldestResponseDate.startOf('day'), 'days');

    return times(daysInRange + 1, function(n) {
        const key = oldestResponseDate
            .clone()
            .add(n, 'days')
            .format('YYYY-MM-DD');
        const responsesForDay = grouped[key] || [];

        return {
            x: key,
            y: responsesForDay.length
        };
    });
}

function minMaxAvg(arr) {
    const sorted = arr.slice().sort((a, b) => a - b);
    return {
        lowest: sorted[0] || 0,
        highest: sorted[sorted.length - 1] || 0,
        average: mean(sorted) || 0
    };
}

function measureTimeTaken(data) {
    const appDurations = data.map(row => {
        const created = moment(row.startedAt);
        const submitted = moment(row.createdAt);
        return submitted.diff(created, 'minutes');
    });
    let results = minMaxAvg(appDurations);

    // convert the larger amounts to days
    const minutesToDays = input => input / 60 / 24;
    results.average = minutesToDays(results.average);
    results.highest = minutesToDays(results.highest);

    return results;
}

function measureWordCounts(data) {
    const wordCounts = data.map(function(item) {
        return item.applicationSummary
            .map(_ => _.value)
            .join(' ')
            .split(' ').length;
    });

    return minMaxAvg(wordCounts);
}

function countRequestedAmount(data) {
    const amounts = data.map(item => {
        const row = item.applicationOverview.find(function(row) {
            return (
                row.label === 'Requested amount' ||
                row.label === 'Swm y gofynnwyd amdano'
            );
        });

        return parseInt(
            get(row, 'value', 0)
                .replace('£', '')
                .replace(/,/g, ''),
            10
        );
    });

    const values = minMaxAvg(amounts);
    values.total = sum(amounts);

    return values;
}

function filterByCountry(country, appType) {
    return function(item) {
        if (!country) {
            return item;
        } else if (!item.applicationSummary && !item.applicationData) {
            return false;
        } else {
            let appCountry;

            if (appType === 'pending') {
                appCountry = get(item, 'applicationData.projectCountry');
            } else {
                const rowCountry = item.applicationSummary.find(function(row) {
                    return (
                        row.label ===
                            'What country will your project be based in?' ||
                        row.label === 'Pa wlad fydd eich prosiect wedi’i leoli?'
                    );
                });
                appCountry = get(rowCountry, 'value');
            }

            if (appCountry) {
                const c = appCountry.toLowerCase().replace(' ', '-');
                return c === country;
            } else {
                return false;
            }
        }
    };
}

function titleCase(str) {
    if (!str) {
        return;
    }
    return str.replace(/-/g, ' ').replace(/(^|\s)\S/g, function(t) {
        return t.toUpperCase();
    });
}

function getColourForCountry(countryName) {
    const colourMappings = {
        'England': '#f95d6a',
        'Northern Ireland': '#2f4b7c',
        'Scotland': '#a05195',
        'Wales': '#ffa600',
        'Location unspecified': '#cccccc'
    };

    return colourMappings[countryName] || '#e5007d';
}

function getDataStudioUrlForForm(formId) {
    return formId === 'awards-for-all' ? DATA_STUDIO_AFA_URL : null;
}

function getApplicationTitle(applicationId) {
    const formBuilder = formBuilderFor(applicationId);
    const form = formBuilder();
    return form.title;
}

router.get('/', function(req, res) {
    res.redirect('/tools');
});

router.get('/:applicationId', async (req, res, next) => {
    const { applicationId } = req.params;

    const dateRange = getDateRange(req.query.start, req.query.end) || {
        start: moment()
            .subtract(30, 'days')
            .toDate(),
        end: moment().toDate()
    };

    const country = req.query.country;
    const countryTitle = country ? titleCase(country) : false;
    const applicationTitle = getApplicationTitle(applicationId);
    const dataStudioUrl = getDataStudioUrlForForm(applicationId);

    async function getApplications(appType) {
        if (appType === 'submitted') {
            return SubmittedApplication.findAllByForm(applicationId, dateRange)
                .map(function(row) {
                    // Convert Sequelize instance into a plain object so we can modify it
                    const data = row.get({ plain: true });
                    data.country = data.applicationCountry
                        ? data.applicationCountry
                        : get(data, 'applicationData.projectCountry');
                    return data;
                })
                .filter(filterByCountry(country, appType));
        } else {
            return PendingApplication.findAllByForm(applicationId, dateRange)
                .map(function(row) {
                    const formBuilder = formBuilderFor(applicationId);
                    const form = formBuilder({
                        locale: req.i18n.getLocale(),
                        data: row.applicationData
                    });
                    // Convert Sequelize instance into a plain object so we can modify it
                    const data = row.get({ plain: true });
                    data.country = form.summary.country;
                    return data;
                })
                .filter(filterByCountry(country, appType));
        }
    }

    try {
        const feedback = await Feedback.findByDescription(
            getApplicationTitle(applicationId)
        );

        const appTypes = [
            {
                id: 'pending',
                title: 'In-progress applications created',
                verb: 'in progress',
                applications: await getApplications('pending')
            },
            {
                id: 'submitted',
                title: 'Submitted applications',
                verb: 'submitted',
                applications: await getApplications('submitted')
            }
        ];

        const getAppsToday = dataset => {
            const appsToday = dataset.find(
                _ => _.x === moment().format('YYYY-MM-DD')
            );
            return appsToday ? appsToday.y : 0;
        };

        const applicationData = appTypes.map(appType => {
            const appsPerDay = applicationsByDay(appType.applications);
            appType.data = {
                appsPerDay: appsPerDay,
                totals: {
                    applicationsToday: getAppsToday(appsPerDay),
                    applicationsAll: appType.applications.length,
                    uniqueUsers: uniqBy(appType.applications, 'userId').length
                }
            };

            if (appType.id === 'pending') {
                appType.data.totals.completedStates = PendingApplication.countCompleted(
                    appType.applications
                );
            }

            let appsByCountryByDay = [];

            if (!country) {
                const appsByCountry = groupBy(appType.applications, 'country');
                for (const [appCountry, apps] of Object.entries(
                    appsByCountry
                )) {
                    if (appCountry) {
                        const countryName =
                            appCountry !== 'undefined'
                                ? titleCase(appCountry)
                                : 'Location unspecified';
                        appsByCountryByDay.push({
                            title: countryName,
                            data: applicationsByDay(apps),
                            colour: getColourForCountry(countryName)
                        });
                    }
                }
            }
            appType.appsByCountryByDay = appsByCountryByDay;

            return appType;
        });

        const submittedApplications = appTypes.find(_ => _.id === 'submitted')
            .applications;

        const statistics = {
            appDurations: measureTimeTaken(submittedApplications),
            wordCount: measureWordCounts(submittedApplications),
            requestedAmount: countRequestedAmount(submittedApplications),
            totalSubmitted: submittedApplications.length
        };

        const title = 'Applications';

        let extraBreadcrumbs = [
            {
                label: title,
                url: '/tools/applications'
            },
            {
                label: applicationTitle,
                url: req.baseUrl + req.path
            }
        ];

        if (countryTitle) {
            if (req.query.start) {
                let label = moment(dateRange.start).format('YYYY-MM-DD');
                if (req.query.end) {
                    label += ' — ' + moment(dateRange.end).format('YYYY-MM-DD');
                }

                extraBreadcrumbs = extraBreadcrumbs.concat([
                    {
                        label: countryTitle,
                        url: `${req.baseUrl}${req.path}?country=${country}`
                    },
                    { label: label }
                ]);
            } else {
                extraBreadcrumbs = extraBreadcrumbs.concat([
                    { label: countryTitle }
                ]);
            }
        }

        let breadcrumbs = res.locals.breadcrumbs.concat(extraBreadcrumbs);

        res.render(path.resolve(__dirname, './views/applications'), {
            title: `${applicationTitle} | ${title}`,
            breadcrumbs: breadcrumbs,
            applicationTitle: applicationTitle,
            applicationData: applicationData,
            statistics: statistics,
            dateRange: dateRange,
            country: country,
            countryTitle: countryTitle,
            dataStudioUrl: dataStudioUrl,
            feedback: feedback
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
