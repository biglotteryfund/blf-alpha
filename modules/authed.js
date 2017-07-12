module.exports = (req, res, next) => {
    if (req.user) {
        return next();
    } else {
        req.session.redirectUrl = req.baseUrl + req.path;
        req.session.save(function () {
            res.redirect('/tools/login');
        });
    }
};