const { makeUserLink } = require('./utils');

const dashboard = (req, res) => {
    res.cacheControl = { maxAge: 0 };
    res.render('user/dashboard', {
        user: req.user,
        makeUserLink: makeUserLink,
        errors: res.locals.errors || []
    });
};

module.exports = {
    dashboard
};
