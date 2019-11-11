'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const concat = require('lodash/concat');
const groupBy = require('lodash/groupBy');
const maxBy = require('lodash/maxBy');
const get = require('lodash/get');
const mean = require('lodash/mean');
const uniqBy = require('lodash/uniqBy');
const minBy = require('lodash/minBy');
const times = require('lodash/times');

const {
    PendingApplication,
    SubmittedApplication,
    Feedback
} = require('../../db/models');
const { getDateRange } = require('./helpers');
const { DATA_STUDIO_AFA_URL } = require('../../common/secrets');

const router = express.Router();

const DATE_FORMAT = 'YYYY-MM-DD';

function applicationsByDay(responses) {
    if (responses.length === 0) {
        return [];
    }

    const grouped = groupBy(responses, function(response) {
        return moment(response.createdAt).format(DATE_FORMAT);
    });

    const newestResponse = maxBy(responses, response => response.createdAt);
    const oldestResponse = minBy(responses, response => response.createdAt);
    const oldestResponseDate = moment(oldestResponse.createdAt);

    const daysInRange = moment(newestResponse.createdAt)
        .startOf('day')
        .diff(oldestResponseDate.startOf('day'), 'days');

    const dayData = times(daysInRange + 1, function(n) {
        const key = oldestResponseDate
            .clone()
            .add(n, 'days')
            .format(DATE_FORMAT);
        const responsesForDay = grouped[key] || [];

        return {
            x: key,
            y: responsesForDay.length
        };
    });

    return dayData;
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
    const wordCounts = data.map(
        d =>
            d.applicationSummary
                .map(_ => _.value)
                .join(' ')
                .split(' ').length
    );
    return minMaxAvg(wordCounts);
}

function countRequestedAmount(data) {
    const amounts = data.map(item => {
        const row = item.applicationOverview.find(
            _ =>
                _.label === 'Requested amount' ||
                _.label === 'Swm y gofynnwyd amdano'
        );
        return parseInt(
            get(row, 'value', 0)
                .replace('£', '')
                .replace(/,/g, ''),
            10
        );
    });
    let values = minMaxAvg(amounts);
    values.total = amounts.reduce((acc, cur) => {
        return acc + cur;
    }, 0);
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
                const rowCountry = item.applicationSummary.find(
                    _ =>
                        _.label ===
                            'What country will your project be based in?' ||
                        _.label === 'Pa wlad fydd eich prosiect wedi’i leoli?'
                );
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
    let colour = '';
    switch (countryName) {
        case 'England':
            colour = '#f95d6a';
            break;
        case 'Northern Ireland':
            colour = '#2f4b7c';
            break;
        case 'Scotland':
            colour = '#a05195';
            break;
        case 'Wales':
            colour = '#ffa600';
            break;
        case 'Location unspecified':
            colour = '#cccccc';
            break;
        default:
            colour = '#e5007d';
            break;
    }
    return colour;
}

function getDataStudioUrlForForm(formId) {
    let url;
    switch (formId) {
        case 'awards-for-all':
            url = DATA_STUDIO_AFA_URL;
            break;
        default:
            url = null;
            break;
    }
    return url;
}

function getApplicationTitle(applicationId) {
    let title;
    switch (applicationId) {
        case 'awards-for-all':
            title = 'National Lottery Awards for All';
            break;
        case 'standard-enquiry':
            title = 'Your funding proposal';
            break;
        default:
            break;
    }
    return title;
}

function getProjectCountry(applicationId, applicationData) {
    if (applicationId === 'awards-for-all') {
        return get(applicationData, 'projectCountry');
    } else if (applicationId === 'standard-enquiry') {
        const countries = get(applicationData, 'projectCountries', []);
        return countries.length > 1 ? 'uk-wide' : countries[0];
    }
}

router.get('/', function(req, res) {
    res.redirect('/tools');
});

router.get('/:applicationId', async (req, res, next) => {
    let dateRange = getDateRange(req.query.start, req.query.end);
    if (!dateRange) {
        dateRange = {
            start: moment()
                .subtract(30, 'days')
                .toDate(),
            end: moment().toDate()
        };
    }

    const country = req.query.country;
    const countryTitle = country ? titleCase(country) : false;

    function getPendingApplications() {
        return PendingApplication.findAllByForm(
            req.params.applicationId,
            dateRange
        ).then(applications => {
            return applications
                .map(function(row) {
                    const data = row.get({ plain: true });
                    data.country = getProjectCountry(
                        req.params.applicationId,
                        row.applicationData
                    );
                    return data;
                })
                .filter(filterByCountry(country, 'pending'));
        });
    }

    function getSubmittedApplications() {
        return SubmittedApplication.findAllByForm(
            req.params.applicationId,
            dateRange
        ).then(applications => {
            return applications
                .map(function(application) {
                    const data = application.get({ plain: true });
                    data.country = data.applicationCountry;
                    return data;
                })
                .filter(filterByCountry(country, 'submitted'));
        });
    }

    try {
        const applicationTitle = getApplicationTitle(req.params.applicationId);
        const dataStudioUrl = getDataStudioUrlForForm(req.params.applicationId);

        const feedbackDescription = getApplicationTitle(
            req.params.applicationId
        );
        const feedback = feedbackDescription
            ? await Feedback.findAllForDescription(feedbackDescription)
            : null;

        const appTypes = [
            {
                id: 'pending',
                title: 'In-progress applications created',
                verb: 'in progress',
                applications: await getPendingApplications()
            },
            {
                id: 'submitted',
                title: 'Submitted applications',
                verb: 'submitted',
                applications: await getSubmittedApplications()
            }
        ];

        const getAppsToday = dataset => {
            const appsToday = dataset.find(
                _ => _.x === moment().format(DATE_FORMAT)
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

        const oldestSubmittedApplication = minBy(
            submittedApplications,
            response => response.createdAt
        );

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
            if (!req.query.start) {
                extraBreadcrumbs = concat(extraBreadcrumbs, [
                    {
                        label: countryTitle
                    }
                ]);
            } else {
                let label = moment(dateRange.start).format(DATE_FORMAT);
                if (req.query.end) {
                    label += ' — ' + moment(dateRange.end).format(DATE_FORMAT);
                }
                extraBreadcrumbs = concat(extraBreadcrumbs, [
                    {
                        label: countryTitle,
                        url: req.baseUrl + req.path + '?country=' + country
                    },
                    {
                        label: label
                    }
                ]);
            }
        }

        let breadcrumbs = concat(res.locals.breadcrumbs, extraBreadcrumbs);

        res.render(path.resolve(__dirname, './views/applications'), {
            title: `${applicationTitle} | ${title}`,
            breadcrumbs: breadcrumbs,
            applicationTitle: applicationTitle,
            applicationData: applicationData,
            statistics: statistics,
            dateRange: dateRange,
            oldestDate: moment(oldestSubmittedApplication.createdAt).toDate(),
            now: new Date(),
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
