'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const groupBy = require('lodash/groupBy');
const maxBy = require('lodash/maxBy');
const minBy = require('lodash/minBy');
const times = require('lodash/times');

const { Users } = require('../../db/models');

function chartData(users) {
    if (users.length === 0) {
        return [];
    }

    const grouped = groupBy(users, function(response) {
        return moment(response.createdAt).format('YYYY-MM-DD');
    });

    const newestUser = maxBy(users, response => response.createdAt);
    const oldestUser = minBy(users, response => response.createdAt);
    const oldestDate = moment(oldestUser.createdAt);

    const daysInRange = moment(newestUser.createdAt)
        .startOf('day')
        .diff(oldestDate.startOf('day'), 'days');

    return times(daysInRange, function(n) {
        const key = oldestDate
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
        const allUsers = await Users.findAndCountAll();

        const totalActiveUsers = await Users.count({
            where: { is_active: true }
        });

        const totalInactiveUsers = await Users.count({
            where: { is_active: false }
        });

        res.render(path.resolve(__dirname, './views/users'), {
            breadcrumbs: res.locals.breadcrumbs.concat([
                { label: 'User accounts summary' }
            ]),
            chartData: chartData(allUsers.rows),
            totalUsers: allUsers.count,
            totalActiveUsers,
            totalInactiveUsers
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
