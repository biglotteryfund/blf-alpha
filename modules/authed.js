module.exports = (req, res, next) => {
    if (req.user) {
        return next();
    } else {
        // @TODO make login?
        // res.redirect('/login');
        return res.status(401).json({
            error: 'User not authenticated'
        });
    }
};