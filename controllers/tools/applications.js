'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const concat = require('lodash/concat');
const groupBy = require('lodash/groupBy');
const maxBy = require('lodash/maxBy');
const uniqBy = require('lodash/uniqBy');
const minBy = require('lodash/minBy');
const times = require('lodash/times');

const { PendingApplication, SubmittedApplication } = require('../../db/models');

const router = express.Router();

const DATE_FORMAT = 'YYYY-MM-DD';

// @TODO share some of this with surveys/voteDataFor?
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

    const dayData = times(daysInRange, function(n) {
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

router.get('/:applicationId', async (req, res, next) => {
    try {
        const responsesPending = await PendingApplication.findAllByForm(
            req.params.applicationId
        );

        const responsesSubmitted = await SubmittedApplication.findAllByForm(
            req.params.applicationId
        );

        const appsPerDay = {
            pending: applicationsByDay(responsesPending),
            submitted: applicationsByDay(responsesSubmitted)
        };

        const today = moment().format(DATE_FORMAT);
        const appsToday = {
            pending: appsPerDay.pending.filter(_ => _.x === today),
            submitted: appsPerDay.submitted.filter(_ => _.x === today)
        };

        const data = {
            applications: [
                {
                    id: 'pending',
                    title: 'Number of applications started per day',
                    shortTitle: 'Applications created',
                    data: {
                        totalResponses: responsesPending.length,
                        appsPerDay: appsPerDay.pending
                    }
                },
                {
                    id: 'submitted',
                    title: 'Number of applications submitted per day',
                    shortTitle: 'Applications submitted',
                    data: {
                        totalResponses: responsesSubmitted.length,
                        appsPerDay: appsPerDay.submitted
                    }
                }
            ],
            totals: {
                pending: responsesPending.length,
                submitted: responsesSubmitted.length,
                appsToday: {
                    pending: appsToday.pending.length ? appsToday.pending.y : 0,
                    submitted: appsToday.submitted.length
                        ? appsToday.submitted.y
                        : 0
                },
                uniqueUsers: {
                    pending: uniqBy(responsesPending, 'userId').length,
                    submitted: uniqBy(responsesSubmitted, 'userId').length
                }
            }
        };

        const title = 'Applications';
        const breadcrumbs = concat(res.locals.breadcrumbs, [{ label: title }]);

        res.render(path.resolve(__dirname, './views/applications'), {
            title: title,
            breadcrumbs: breadcrumbs,
            applicationId: req.params.applicationId,
            data: data
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
