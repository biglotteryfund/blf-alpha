'use strict';
/**
 * Passport strategies
 * Note: we return null after callbacks in this file to avoid this warning:
 * @see https://github.com/jaredhanson/passport/pull/461
 */
const has = require('lodash/has');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const features = require('config').get('features');

const { AZURE_AUTH } = require('../common/secrets');
const { Users, Staff } = require('../db/models');

/**
 * User sign-in strategy
 */
function localAuthStrategy() {
    return new LocalStrategy(async function(username, password, done) {
        try {
            const user = await Users.findByUsername(username);
            if (user) {
                const isValid = await Users.hasValidPassword(
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
 * Staff sign-in strategy
 * Uses Azure Active Directory
 */
function azureAuthStrategy() {
    return new OIDCStrategy(
        {
            identityMetadata: AZURE_AUTH.metadataUrl,
            clientID: AZURE_AUTH.clientId,
            // Allowed in development environments
            allowHttpForRedirectUrl: features.enableAllowHttpAuthRedirect,
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
    passport.use(localAuthStrategy());

    if (AZURE_AUTH.clientId) {
        passport.use(azureAuthStrategy());
    }

    passport.serializeUser(function(user, done) {
        done(null, user);
        return null;
    });

    passport.deserializeUser(async function(serializedUsed, done) {
        try {
            const model = has(serializedUsed, 'oid') ? Staff : Users;
            const user = await model.findById(serializedUsed.id);
            done(null, user);
            return null;
        } catch (err) {
            done(err, null);
            return null;
        }
    });

    return [passport.initialize(), passport.session()];
};
