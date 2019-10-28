'use strict';
const path = require('path');
const express = require('express');
const faker = require('faker');
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
const random = require('lodash/random');
const times = require('lodash/times');
const features = require('config').get('features');

const { SurveyAnswer } = require('../../db/models');

const router = express.Router();

function voteDataFor(responses) {
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

    return times(daysInRange, function(n) {
        const key = oldestResponseDate
            .clone()
            .add(n, 'days')
            .format('YYYY-MM-DD');

        const responsesForDay = grouped[key] || [];

        const yesResponsesForDay = responsesForDay.filter(function(response) {
            return response.choice === 'yes';
        });

        const yesPercentageForDay = Math.round(
            (yesResponsesForDay.length / responsesForDay.length) * 100
        );

        return {
            x: key,
            y: yesPercentageForDay
        };
    });
}

function recentStatsFor(responses) {
    const recentResponses = responses.filter(response => {
        const startDt = moment().subtract('30', 'days');
        return moment(response.createdAt).isSameOrAfter(startDt, 'day');
    });

    const [monthYes, monthNo] = partition(recentResponses, ['choice', 'yes']);

    return {
        yesCount: monthYes.length,
        noCount: monthNo.length,
        percentage: Math.round((monthYes.length / recentResponses.length) * 100)
    };
}

function pageCountsFor(responses) {
    return orderBy(
        map(countBy(responses, 'path'), (val, key) => ({
            path: key,
            count: val
        })),
        'count',
        'desc'
    );
}

router.get('/', async (req, res, next) => {
    try {
        const responses = await SurveyAnswer.findAllByPath(req.query.path);

        const survey = {
            totalResponses: responses.length,
            voteData: voteDataFor(responses),
            recentStats: recentStatsFor(responses),
            pageCounts: pageCountsFor(responses),
            noResponses: filter(responses, ['choice', 'no'])
        };

        const title = 'Surveys';
        const breadcrumbs = concat(res.locals.breadcrumbs, [{ label: title }]);

        res.render(path.resolve(__dirname, './views/survey'), {
            title: title,
            breadcrumbs: breadcrumbs,
            survey: survey,
            pathQuery: req.query.path
        });
    } catch (error) {
        next(error);
    }
});

if (features.enableSeeders) {
    router.get('/seed', async (_req, res, next) => {
        function mockResponses(count) {
            const promises = times(count, function() {
                const choice = Math.random() > 0.05 ? 'yes' : 'no';
                return SurveyAnswer.create({
                    choice: choice,
                    path: faker.random.arrayElement([
                        '/',
                        '/funding',
                        '/about'
                    ]),
                    message: choice === 'no' ? faker.lorem.paragraphs(1) : null,
                    createdAt: moment()
                        .subtract(random(0, 90), 'days')
                        .toISOString()
                });
            });

            return Promise.all(promises);
        }

        try {
            const results = await mockResponses(50);
            res.send(`Seeded ${results.length} survey responses`);
        } catch (error) {
            next(error);
        }
    });
}

module.exports = router;
