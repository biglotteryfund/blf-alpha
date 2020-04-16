'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const concat = require('lodash/concat');
const countBy = require('lodash/countBy');
const filter = require('lodash/filter');
const groupBy = require('lodash/groupBy');
const map = require('lodash/map');
const maxBy = require('lodash/maxBy');
const minBy = require('lodash/minBy');
const orderBy = require('lodash/orderBy');
const partition = require('lodash/partition');
const times = require('lodash/times');

const { SurveyAnswer } = require('../../../db/models');
const { sanitise } = require('../../../common/sanitise');
const csvSummary = require('./lib/csv-summary');

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

    const voteData = times(daysInRange, function (n) {
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

    return voteData;
}

function recentStatsFor(responses) {
    const recentResponses = responses.filter((response) => {
        const startDt = moment().subtract('30', 'days');
        return moment(response.createdAt).isSameOrAfter(startDt, 'day');
    });

    const [monthYes, monthNo] = partition(recentResponses, ['choice', 'yes']);

    return {
        yesCount: monthYes.length,
        noCount: monthNo.length,
        percentage: Math.round(
            (monthYes.length / recentResponses.length) * 100
        ),
    };
}

function pageCountsFor(responses) {
    return orderBy(
        map(countBy(responses, 'path'), (val, key) => ({
            path: key,
            count: val,
        })),
        'count',
        'desc'
    );
}

router.get('/', async function (req, res, next) {
    if (req.query.download && req.query.path) {
        try {
            const responses = await SurveyAnswer.findAllByPath(
                sanitise(req.query.path)
            );
            if (responses.length > 0) {
                res.attachment(`surveyResponses.csv`).send(
                    csvSummary(responses)
                );
            } else {
                next();
            }
        } catch (error) {
            next(error);
        }
    } else {
        try {
            const responses = await SurveyAnswer.findAllByPath(
                sanitise(req.query.path)
            );

            const survey = {
                totalResponses: responses.length,
                voteData: voteDataFor(responses),
                recentStats: recentStatsFor(responses),
                pageCounts: pageCountsFor(responses),
                pageCountsWithResponses: pageCountsFor(
                    responses.filter((response) => {
                        return response.message;
                    })
                ),
                noResponses: filter(responses, ['choice', 'no']),
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
        } catch (error) {
            next(error);
        }
    }
});

module.exports = router;
