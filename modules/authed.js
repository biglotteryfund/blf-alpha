const checkAuthStatus = (req, res, next, minimumLevel) => {
    if (!minimumLevel) {
        minimumLevel = 0;
    }
    if (req.user && req.user.level >= minimumLevel) {
        return next();
    } else {
        req.session.redirectUrl = req.baseUrl + req.path;
        req.session.save(() => {
            res.redirect('/user/login');
        });
    }
};

// middleware for pages only authenticated users should see
// eg. dashboard
const requireAuthed = (req, res, next) => checkAuthStatus(req, res, next);

const requireAuthedLevel = minimumLevel => {
    return (req, res, next) => checkAuthStatus(req, res, next, minimumLevel);
};

// middleware for pages only non-authed users should see
// eg. register/login
const requireUnauthed = (req, res, next) => {
    if (!req.user) {
        return next();
    } else {
        console.log('got invalid user');
        res.redirect('/user/dashboard');
    }
};

module.exports = {
    requireAuthed,
    requireUnauthed,
    requireAuthedLevel
};
