'use strict';
const { makeUserLink } = require('./utils');

const dashboard = (req, res) => {
    res.render('user/dashboard', {
        user: req.user,
        makeUserLink: makeUserLink,
        errors: res.locals.errors || []
    });
};

module.exports = {
    dashboard
};
