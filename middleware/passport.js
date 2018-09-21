'use strict';
const passport = require('passport');
const config = require('config');
const LocalStrategy = require('passport-local').Strategy;
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const userService = require('../services/user');
const { AZURE_AUTH } = require('../modules/secrets');
const appData = require('../modules/appData');

module.exports = function() {
    // Configure standard user sign-in (eg. members of the public)
    passport.use(
        new LocalStrategy((username, password, done) => {
            userService
                .findByUsername(username)
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

    // Only initialise this auth strategy if secrets exist (eg. not on CI)
    if (config.get('features.azureAuthEnabled') && AZURE_AUTH.MS_CLIENT_ID) {
        // Configure staff user sign-in (eg. internal authentication)
        const authEndpoint =
            'https://login.microsoftonline.com/biglotteryfund.onmicrosoft.com/.well-known/openid-configuration';

        // Separate out the combined cookie encryption keys
        const cookieKeys = AZURE_AUTH.MS_COOKIES.map(keyPair => {
            const [key, iv] = keyPair.split(';');
            return { key, iv };
        });

        passport.use(
            new OIDCStrategy(
                {
                    identityMetadata: authEndpoint,
                    clientID: AZURE_AUTH.MS_CLIENT_ID,
                    allowHttpForRedirectUrl: appData.isDev,
                    redirectUrl: AZURE_AUTH.MS_REDIRECT_URL,
                    clientSecret: AZURE_AUTH.MS_CLIENT_SECRET,
                    cookieEncryptionKeys: cookieKeys,
                    responseType: 'code id_token',
                    responseMode: 'form_post',
                    validateIssuer: true,
                    isB2C: false,
                    issuer: null,
                    passReqToCallback: false,
                    scope: null,
                    loggingLevel: 'warn',
                    nonceLifetime: null,
                    nonceMaxAmount: 5,
                    useCookieInsteadOfSession: false,
                    clockSkew: null
                },
                (iss, sub, profile, accessToken, refreshToken, done) => {
                    if (!profile.oid) {
                        return done(new Error('No oid found'), null);
                    }
                    userService.findOrCreateStaffUser(profile, (err, response) => {
                        if (err) {
                            return done(err);
                        }
                        if (response.wasCreated) {
                            return done(null, response.user);
                        }
                        return done(null, response.user);
                    });
                }
            )
        );
    }

    const makeUserObject = user => {
        return {
            userType: user.constructor.name,
            userData: user
        };
    };

    passport.serializeUser((user, cb) => {
        cb(null, makeUserObject(user));
    });

    passport.deserializeUser((user, cb) => {
        if (user.userType === 'user') {
            userService
                .findById(user.userData.id)
                .then(userObj => {
                    cb(null, makeUserObject(userObj));
                })
                .catch(err => {
                    return cb(err);
                });
        } else if (user.userType === 'staff') {
            userService
                .findStaffUserById(user.userData.id)
                .then(staffUser => {
                    cb(null, makeUserObject(staffUser));
                })
                .catch(err => {
                    return cb(err);
                });
        }
    });

    return [passport.initialize(), passport.session()];
};
