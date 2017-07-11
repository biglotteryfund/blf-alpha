module.exports = (req, res, next) => {
    if (req.user) {
        return next();
    } else {
        req.session.redirectUrl = req.baseUrl + req.path;
        res.redirect('/tools/login');
    }
};