'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment-timezone');
const partition = require('lodash/partition');
const times = require('lodash/times');

const { Op } = require('sequelize');
const { Users, PendingApplication } = require('../../db/models');

const {
    getDateRangeWithDefault,
    groupByCreatedAt,
    getOldestDate,
    getDaysInRange
} = require('./lib/date-helpers');

const { processResetRequest } = require('../user/lib/password-reset');
const { environment } = require('../../common/appData');
const isProduction = environment === 'production';

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

router
    .route('/dashboard')
    .all((req, res, next) => {
        const allowedGroups = [
            'cc8dd518-4e0b-412f-983f-86e7ab852669', // advice
            '40d00757-141c-4f20-9f56-8750fb7366e0' // digital
        ];
        if (
            req.session.activeDirectoryGroups &&
            req.session.activeDirectoryGroups.some(groupId =>
                allowedGroups.includes(groupId)
            )
        ) {
            next();
        } else {
            res.send(`You are not authorised to access this tool. 
                If you think you should be able to see this, try <a href="/user/staff/logout">logging out</a> then logging back in.`);
        }
    })
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
                const allMatchingUsers = await Users.findByUsernameFuzzy(
                    usernameSearch
                );
                res.locals.users = allMatchingUsers.map(user => {
                    if (!user.is_active && user.date_activation_sent) {
                        user.activationExpires = moment
                            .unix(user.date_activation_sent)
                            .tz('Europe/London')
                            .fromNow();
                    }
                    return user;
                });
                res.locals.usernameSearch = usernameSearch;
            } else if (applicationsByUserId) {
                const [pendingApps, singleUser] = await Promise.all([
                    PendingApplication.findAllByUserId(applicationsByUserId),
                    Users.findByPk(applicationsByUserId)
                ]);

                res.locals.singleUser = singleUser;

                res.locals.pendingApps = pendingApps.map(app => {
                    app.expiresAtRelative = moment(app.expiresAt)
                        .tz('Europe/London')
                        .fromNow();
                    return app;
                });
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
    .post(async (req, res) => {
        const userId = req.body.userId;
        const action = req.body.action;
        if (userId && action) {
            const user = await Users.findByPk(req.body.userId);
            if (user) {
                if (!req.body.confirmed) {
                    // Render the confirmation check
                    return res.render(
                        path.resolve(__dirname, './views/user-dashboard'),
                        {
                            confirmMode: true,
                            userToModify: user,
                            action: action,
                            title: 'Please confirm your action'
                        }
                    );
                } else {
                    // Take the action
                    if (action === 'activateUser') {
                        await Users.activateUser(user.id);
                        return res.redirect(
                            req.baseUrl + '/dashboard?s=userActivated'
                        );
                    } else if (action === 'sendResetPasswordEmail') {
                        if (isProduction) {
                            await processResetRequest(req, user);
                        }
                        return res.redirect(
                            req.baseUrl +
                                '/dashboard?s=userPasswordResetRequested'
                        );
                    }
                }
            }
        }
        return res.redirect(req.baseUrl + '/dashboard');
    });

module.exports = router;
