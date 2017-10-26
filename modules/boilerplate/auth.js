'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const models = require('../../models');

passport.use(
    new LocalStrategy((username, password, done) => {
        models.Users
            .findOne({ where: { username: username } })
            .then(user => {
                // use generic error messages here to avoid exposing existing accounts
                let genericError = 'Your username and password combination is invalid';
                if (!user) {
                    return done(null, false, { message: genericError });
                }
                if (!user.isValidPassword(user.password, password)) {
                    return done(null, false, { message: genericError });
                }
                return done(null, user);
            })
            .catch(err => {
                return done(err);
            });
    })
);

passport.serializeUser((user, cb) => {
    cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
    models.Users
        .findById(id)
        .then(user => {
            cb(null, user);
        })
        .catch(err => {
            return cb(err);
        });
});
