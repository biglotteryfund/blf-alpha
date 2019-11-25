'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const partition = require('lodash/partition');
const times = require('lodash/times');

const { Op } = require('sequelize');
const {
    Users,
    PendingApplication,
    SubmittedApplication
} = require('../../db/models');

const {
    getDateRangeWithDefault,
    groupByCreatedAt,
    getOldestDate,
    getDaysInRange
} = require('./lib/date-helpers');

const { processResetRequest } = require('../user/lib/password-reset');

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
        const dateRange = getDateRangeWithDefault(
            req.query.start,
            req.query.end
        );

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

/*
 * @TODO
 *
 * search by email address (fuzzy)
 * activate user
 * trigger password reset
 * send activation email?
 * search for application by user? possibly "show users applications"?
 */
router
    .route('/dashboard')
    .get(async (req, res, next) => {
        try {
            const title = 'User dashboard';
            res.locals.title = title;
            res.locals.breadcrumbs = res.locals.breadcrumbs.concat({
                label: title
            });
            const usernameSearch = req.query.q;
            const applicationsByUserId = req.query.appsById;

            if (usernameSearch && usernameSearch !== '') {
                res.locals.users = await Users.findByUsernameFuzzy(
                    usernameSearch
                );
                res.locals.usernameSearch = usernameSearch;
            } else if (applicationsByUserId) {
                const [
                    pendingApps,
                    submittedApps,
                    singleUser
                ] = await Promise.all([
                    PendingApplication.findAllByUserId(applicationsByUserId),
                    SubmittedApplication.findAllByUserId(applicationsByUserId),
                    Users.findByPk(applicationsByUserId)
                ]);
                res.locals.singleUser = singleUser;
                res.locals.submittedApps = submittedApps;
                res.locals.pendingApps = pendingApps;
            }

            switch (req.query.s) {
                case 'userActivated':
                    res.locals.statusMessage = `The user was successfully activated!`;
                    break;
                case 'userPasswordResetRequested':
                    res.locals.statusMessage = `The user was sent an email with a password reset link.`;
                    break;
            }

            res.render(path.resolve(__dirname, './views/user-dashboard'));
        } catch (error) {
            next(error);
        }
    })
    .post(async (req, res, next) => {
        const userToActivate = req.body.userToActivate;
        const userToSendPasswordReset = req.body.userToSendPasswordReset;
        if (userToActivate) {
            const user = await Users.findByPk(userToActivate);
            if (user) {
                await Users.activateUser(user.id);
                res.redirect(req.baseUrl + '/dashboard?s=userActivated');
            }
        } else if (userToSendPasswordReset) {
            const user = await Users.findByPk(userToSendPasswordReset);
            if (user) {
                await processResetRequest(req, user);
                res.redirect(
                    req.baseUrl + '/dashboard?s=userPasswordResetRequested'
                );
            }
        } else {
            res.redirect(req.baseUrl + '/dashboard');
        }
    });

module.exports = router;
