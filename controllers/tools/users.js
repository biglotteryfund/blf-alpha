'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const partition = require('lodash/partition');
const times = require('lodash/times');

const { Op } = require('sequelize');
const { Users } = require('../../db/models');

const {
    getDateRange,
    groupByCreatedAt,
    getOldestDate,
    getDaysInRange
} = require('./lib/date-helpers');

function chartData(users) {
    if (users.length === 0) {
        return [];
    }

    const grouped = groupByCreatedAt(users);

    return times(getDaysInRange(users) + 1, function(n) {
        const key = moment(getOldestDate(users))
            .clone()
            .add(n, 'days')
            .format('YYYY-MM-DD');

        const usersForDay = grouped[key] || [];

        return {
            x: key,
            y: usersForDay.length
        };
    });
}

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        let dateRange = getDateRange(req.query.start, req.query.end);
        if (!dateRange) {
            dateRange = {
                start: moment()
                    .subtract(30, 'days')
                    .toDate(),
                end: moment().toDate()
            };
        }

        const allUsers = await Users.findAndCountAll({
            where: {
                createdAt: { [Op.between]: [dateRange.start, dateRange.end] }
            }
        });

        const [active, inactive] = partition(
            allUsers.rows,
            row => row.is_active
        );

        const title = 'User accounts summary';
        res.render(path.resolve(__dirname, './views/users'), {
            title: title,
            breadcrumbs: res.locals.breadcrumbs.concat({ label: title }),
            chartData: chartData(allUsers.rows),
            totalUsers: allUsers.count,
            totalActiveUsers: active.length,
            totalInactiveUsers: inactive.length,
            totalActivePercentage: Math.round(
                (active.length / allUsers.count) * 100
            ),
            dateRange: dateRange,
            oldestDate: getOldestDate(allUsers.rows),
            now: new Date()
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
