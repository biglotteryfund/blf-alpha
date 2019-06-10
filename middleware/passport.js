'use strict';
/**
 * Passport strategies
 * Note: we return null after callbacks in this file to avoid this warning:
 * @see https://github.com/jaredhanson/passport/pull/461
 */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const appData = require('../common/appData');
const { AZURE_AUTH } = require('../common/secrets');
const { Staff } = require('../db/models');
const userService = require('../services/user');

/**
 * Staff sign-in strategy
 * Uses Azure Active Directory
 */
function azureAuthStrategy() {
    return new OIDCStrategy(
        {
            identityMetadata: AZURE_AUTH.metadataUrl,
            clientID: AZURE_AUTH.clientId,
            allowHttpForRedirectUrl: appData.isDev,
            redirectUrl: AZURE_AUTH.redirectUrl,
            clientSecret: AZURE_AUTH.clientSecret,
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
        async function(iss, sub, profile, accessToken, refreshToken, done) {
            if (profile.oid) {
                try {
                    const user = await Staff.findOrCreateProfile(profile);
                    done(null, user);
                    return null;
                } catch (err) {
                    done(err);
                    return null;
                }
            } else {
                done(new Error('No oid found'), null);
                return null;
            }
        }
    );
}

module.exports = function() {
    // Configure standard user sign-in (eg. members of the public)
    passport.use(
        new LocalStrategy((username, password, done) => {
            userService
                .findByUsername(username)
                .then(user => {
                    /**
                     * Use generic error messages here to avoid exposing existing accounts
                     */
                    const genericError =
                        'Your username and password combination is invalid';
                    if (!user) {
                        done(null, false, { message: genericError });
                        return null;
                    }

                    userService
                        .isValidPassword(user.password, password)
                        .then(isValid => {
                            if (isValid) {
                                done(null, user);
                                return null;
                            } else {
                                done(null, false, { message: genericError });
                                return null;
                            }
                        })
                        .catch(() => {
                            done(null, false, { message: genericError });
                            return null;
                        });
                })
                .catch(err => {
                    done(err);
                    return null;
                });
        })
    );

    /**
     * Configure staff user sign-in (eg. internal authentication)
     * Only initialise this auth strategy if secrets exist (eg. not on CI)
     */
    if (AZURE_AUTH.clientId) {
        passport.use(azureAuthStrategy());
    }

    const makeUserObject = user => {
        if (!user) {
            // We need to do this because the user object comes from
            // userService.findById(), which returns null if the user doesn't exist.
            // eg. this doesn't trigger any of our catch() blocks below
            // and instead throws a 500 error for all pages for this user.
            return null;
        }
        return {
            userType: user.constructor.name,
            userData: user
        };
    };

    passport.serializeUser((user, cb) => {
        cb(null, makeUserObject(user));
        return null;
    });

    passport.deserializeUser((user, cb) => {
        if (user.userType === 'user') {
            userService
                .findById(user.userData.id)
                .then(userObj => {
                    cb(null, makeUserObject(userObj));
                    return null;
                })
                .catch(err => {
                    cb(err, null);
                    return null;
                });
        } else if (user.userType === 'staff') {
            Staff.findById(user.userData.id)
                .then(staffUser => {
                    cb(null, makeUserObject(staffUser));
                    return null;
                })
                .catch(err => {
                    cb(err, null);
                    return null;
                });
        }
    });

    return [passport.initialize(), passport.session()];
};
