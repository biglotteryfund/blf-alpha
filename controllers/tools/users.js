'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');

const partition = require('lodash/partition');
const times = require('lodash/times');

const { Op } = require('sequelize');
const { Users } = require('../../db/models');
const {
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
        const allUsers = await Users.findAndCountAll({
            where: {
                createdAt: {
                    [Op.gte]: moment()
                        .subtract('3', 'months')
                        .toDate()
                }
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
            )
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
