'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');

const { SurveyAnswer } = require('../../../db/models');
const { sanitise } = require('../../../common/sanitise');

const csvSummary = require('./lib/csv-summary');
const pageCountsFor = require('./lib/page-counts');
const percentagesFor = require('./lib/percentages');
const voteDataFor = require('./lib/vote-data');

const router = express.Router();

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

            const title = 'Surveys';
            res.render(path.resolve(__dirname, './views/survey'), {
                title: title,
                breadcrumbs: res.locals.breadcrumbs.concat({ label: title }),
                survey: {
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
                },
                pathQuery: req.query.path,
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
