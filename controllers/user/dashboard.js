'use strict';
const { makeUserLink, STATUSES } = require('./utils');

const dashboard = (req, res) => {
    res.locals.STATUSES = STATUSES;
    res.render('user/dashboard', {
        user: req.user,
        makeUserLink: makeUserLink,
        errors: res.locals.errors || [],
        status: req.query.s || false
    });
};

module.exports = {
    dashboard
};
