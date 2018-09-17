'use strict';
const path = require('path');
const { makeUserLink, STATUSES } = require('./utils');

const dashboard = (req, res) => {
    res.locals.STATUSES = STATUSES;
    res.render(path.resolve(__dirname, './views/dashboard'), {
        user: req.user,
        makeUserLink: makeUserLink,
        errors: res.locals.errors || [],
        status: req.query.s || false
    });
};

module.exports = {
    dashboard
};
