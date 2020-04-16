'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const concat = require('lodash/concat');
const groupBy = require('lodash/groupBy');
const maxBy = require('lodash/maxBy');
const minBy = require('lodash/minBy');
const times = require('lodash/times');

const { SurveyAnswer } = require('../../../db/models');
const { sanitise } = require('../../../common/sanitise');

const csvSummary = require('./lib/csv-summary');
const pageCountsFor = require('./lib/page-counts');
const percentagesFor = require('./lib/percentages');

const router = express.Router();

function voteDataFor(responses) {
    if (responses.length === 0) {
        return [];
    }

    const grouped = groupBy(responses, function (response) {
        return moment(response.createdAt).format('YYYY-MM-DD');
    });

    const newestResponse = maxBy(responses, (response) => response.createdAt);
    const oldestResponse = minBy(responses, (response) => response.createdAt);
    const oldestResponseDate = moment(oldestResponse.createdAt);

    const daysInRange = moment(newestResponse.createdAt)
        .startOf('day')
        .diff(oldestResponseDate.startOf('day'), 'days');

    return times(daysInRange, function (n) {
        const key = oldestResponseDate
            .clone()
            .add(n, 'days')
            .format('YYYY-MM-DD');

        const responsesForDay = grouped[key] || [];

        const yesResponsesForDay = responsesForDay.filter(function (response) {
            return response.choice === 'yes';
        });

        const yesPercentageForDay = Math.round(
            (yesResponsesForDay.length / responsesForDay.length) * 100
        );

        return {
            x: key,
            y: yesPercentageForDay,
        };
    });
}

router.get('/', async function (req, res, next) {
    try {
        const responses = await SurveyAnswer.findAllByPath(
            sanitise(req.query.path)
        );

        if (req.query.download && req.query.path && responses.length > 0) {
            res.attachment(`surveyResponses.csv`).send(csvSummary(responses));
        } else {
            const recentResponses = responses.filter(function (response) {
                const startDt = moment().subtract('30', 'days');
                return moment(response.createdAt).isSameOrAfter(startDt, 'day');
            });

            const survey = {
                totalResponses: responses.length,
                voteData: voteDataFor(responses),
                recentStats: percentagesFor(recentResponses),
                pageCounts: pageCountsFor(responses),
                pageCountsWithResponses: pageCountsFor(
                    responses.filter((response) => response.message)
                ),
                noResponses: responses.filter(
                    (response) => response.choice === 'no'
                ),
            };

            const title = 'Surveys';
            const breadcrumbs = concat(res.locals.breadcrumbs, [
                { label: title },
            ]);

            res.render(path.resolve(__dirname, './views/survey'), {
                title: title,
                breadcrumbs: breadcrumbs,
                survey: survey,
                pathQuery: req.query.path,
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
