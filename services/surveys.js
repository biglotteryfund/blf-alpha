'use strict';
const { Op } = require('sequelize');
const moment = require('moment');
const faker = require('faker');
const {
    countBy,
    filter,
    groupBy,
    map,
    maxBy,
    minBy,
    orderBy,
    partition,
    random,
    times
} = require('lodash');

const { SurveyAnswer } = require('../models');
const { purifyUserInput } = require('../modules/validators');

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

    const voteData = times(daysInRange, function(n) {
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

    return voteData;
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

async function summarise(path = null) {
    const query = { order: [['updatedAt', 'DESC']] };
    if (path) {
        query.where = { path: { [Op.eq]: purifyUserInput(path) } };
    }

    const responses = await SurveyAnswer.findAll(query);

    const noResponses = filter(responses, ['choice', 'no']);

    return {
        totalResponses: responses.length,
        voteData: voteDataFor(responses),
        recentStats: recentStatsFor(responses),
        pageCounts: pageCountsFor(responses),
        noResponses: noResponses
    };
}

function createResponse({ choice, path, message }) {
    cleanupOldData();
    return SurveyAnswer.create({
        choice: purifyUserInput(choice),
        path: purifyUserInput(path),
        message: purifyUserInput(message)
    });
}

function mockResponses(count = 50) {
    const promises = times(count, function() {
        const choice = Math.random() > 0.05 ? 'yes' : 'no';
        return SurveyAnswer.create({
            choice: choice,
            path: faker.random.arrayElement(['/', '/funding', '/about']),
            message: choice === 'no' ? faker.lorem.paragraphs(1) : null,
            createdAt: moment()
                .subtract(random(0, 90), 'days')
                .toISOString()
        });
    });

    return Promise.all(promises);
}

function cleanupOldData() {
    return SurveyAnswer.destroy({
        where: {
            createdAt: {
                [Op.lte]: moment()
                    .subtract(3, 'months')
                    .toDate()
            }
        }
    });
}

module.exports = {
    createResponse,
    mockResponses,
    summarise
};
