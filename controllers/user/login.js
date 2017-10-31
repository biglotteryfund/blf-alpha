const passport = require('passport');
const { makeErrorList, makeUserLink } = require('./utils');

// try to validate a user's login request
// @TODO consider rate limiting?
const attemptAuth = (req, res, next) =>
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        } else {
            req.logIn(user, err => {
                if (err) {
                    // user not valid, send them to login again
                    req.flash('formValues', req.body);
                    res.locals.errors = makeErrorList(info.message);
                    return loginForm(req, res);
                } else {
                    // user is valid, send them on
                    // we don't use flash here because it gets unset in the GET route above
                    // @TODO is this still true?
                    let redirectUrl = makeUserLink('dashboard');
                    if (req.body.redirectUrl) {
                        redirectUrl = req.body.redirectUrl;
                    } else if (req.session.redirectUrl) {
                        redirectUrl = req.session.redirectUrl;
                        delete req.session.redirectUrl;
                    }
                    req.session.save(() => {
                        res.redirect(redirectUrl);
                    });
                }
            });
        }
    })(req, res, next);

const loginForm = (req, res) => {
    res.cacheControl = { maxAge: 0 };
    res.render('user/login', {
        makeUserLink: makeUserLink
    });
};

module.exports = {
    attemptAuth,
    loginForm
};
