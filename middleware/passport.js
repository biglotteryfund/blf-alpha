'use strict';
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;

const { AZURE_AUTH } = require('../common/secrets');
const appData = require('../common/appData');
const staffService = require('../services/staff');
const userService = require('../services/user');

/**
 * Configure passport strategies
 * Note: we return null after callbacks here to avoid this warning:
 * @see https://github.com/jaredhanson/passport/pull/461
 */
module.exports = function() {
    /**
     * Configure standard user sign-in
     */
    passport.use(
        new LocalStrategy(async function(username, password, done) {
            try {
                const user = await userService.findByUsername(username);
                if (user) {
                    const isValid = await userService.isValidPassword(
                        user.password,
                        password
                    );

                    if (isValid) {
                        done(null, user);
                        return null;
                    } else {
                        done(null, false);
                        return null;
                    }
                } else {
                    done(null, false);
                    return null;
                }
            } catch (err) {
                done(err);
                return null;
            }
        })
    );

    /**
     * Configure staff user sign-in (eg. internal authentication)
     * Only initialise this auth strategy if secrets exist (eg. not on CI)
     */
    if (AZURE_AUTH.MS_CLIENT_ID) {
        passport.use(
            new OIDCStrategy(
                {
                    identityMetadata: `https://login.microsoftonline.com/tnlcommunityfund.onmicrosoft.com/.well-known/openid-configuration`,
                    clientID: AZURE_AUTH.MS_CLIENT_ID,
                    allowHttpForRedirectUrl: appData.isDev,
                    redirectUrl: AZURE_AUTH.MS_REDIRECT_URL,
                    clientSecret: AZURE_AUTH.MS_CLIENT_SECRET,
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
                        done(new Error('No oid found'), null);
                        return null;
                    }
                    staffService.findOrCreate(profile, (err, response) => {
                        if (err) {
                            done(err);
                            return null;
                        }
                        if (response.wasCreated) {
                            done(null, response.user);
                            return null;
                        }
                        done(null, response.user);
                        return null;
                    });
                }
            )
        );
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
            staffService
                .findById(user.userData.id)
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
