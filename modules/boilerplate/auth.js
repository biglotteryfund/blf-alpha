'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const models = require('../../models');

passport.use(new LocalStrategy(
    function(username, password, done) {
        models.Users.findOne({ where: { username: username } }).then(user => {
            if (!user) {
                return done(null, false, { message: 'Incorrect username.' });
            }
            if (!user.isValidPassword(user.password, password)) {
                return done(null, false, { message: 'Incorrect password.' });
            }
            return done(null, user);
        }).catch(err => {
            return done(err);
        });
    }
));

passport.serializeUser(function(user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
    models.Users.findById(id).then(user => {
        cb(null, user);
    }).catch(err => {
        return cb(err);
    });
});