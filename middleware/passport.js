'use strict';
/**
 * Passport strategies
 * Note: we return null after callbacks in this file to avoid this warning:
 * @see https://github.com/jaredhanson/passport/pull/461
 */
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const features = require('config').get('features');

const { AZURE_AUTH } = require('../common/secrets');
const staffService = require('../services/staff');
const userService = require('../services/user');
const { Users, Staff } = require('../db/models');

/**
 * User sign-in strategy
 */
function localAuthStrategy() {
    return new LocalStrategy(async function(username, password, done) {
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
    });
}

/**
 * Staff sign-in strategy (eg. internal authentication)
 */
function azureAuthStrategy() {
    const strategyConfig = {
        identityMetadata: `https://login.microsoftonline.com/tnlcommunityfund.onmicrosoft.com/.well-known/openid-configuration`,
        clientID: AZURE_AUTH.MS_CLIENT_ID,
        allowHttpForRedirectUrl: features.enableAllowHttpAuthRedirect,
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
    };

    return new OIDCStrategy(strategyConfig, function(
        iss,
        sub,
        profile,
        accessToken,
        refreshToken,
        done
    ) {
        if (profile.oid) {
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
        } else {
            done(new Error('No oid found'), null);
            return null;
        }
    });
}

module.exports = function() {
    passport.use(localAuthStrategy());

    if (AZURE_AUTH.MS_CLIENT_ID) {
        passport.use(azureAuthStrategy());
    }

    function makeUserObject(user) {
        return {
            userType: user.constructor.name,
            userData: user
        };
    }

    passport.serializeUser((user, cb) => {
        cb(null, makeUserObject(user));
        return null;
    });

    passport.deserializeUser(async function(user, done) {
        try {
            const model = user.userType === 'staff' ? Staff : Users;
            const match = await model.findById(user.userData.id);
            done(null, match ? makeUserObject(match) : null);
            return null;
        } catch (err) {
            done(err, null);
            return null;
        }
    });

    return [passport.initialize(), passport.session()];
};
