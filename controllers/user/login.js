'use strict';
const path = require('path');
const express = require('express');
const passport = require('passport');

const {
    rateLimiterConfigs,
    RateLimiter,
} = require('../../common/rate-limiter');
const {
    requireNoAuth,
    redirectUrlWithFallback,
} = require('../../common/authed');
const { csrfProtection } = require('../../common/cached');
const logger = require('../../common/logger').child({ service: 'user' });

const router = express.Router();

function renderForm(req, res, formValues = null, errors = []) {
    res.render(path.resolve(__dirname, './views/login'), {
        title: req.i18n.__('user.login.title'),
        csrfToken: req.csrfToken(),
        formValues: formValues,
        errors: errors,
    });
}

function renderRateLimitError(req, res, minutesLeft) {
    res.status(429).render(path.resolve(__dirname, './views/rate-limited'), {
        title: req.i18n.__('user.rateLimited.title'),
        minutesLeft: minutesLeft,
    });
}

router
    .route('/')
    .all(csrfProtection, requireNoAuth)
    .get(function (req, res) {
        if (req.query.s) {
            res.locals.alertMessage = req.i18n.__(
                `user.common.alertMessages.${req.query.s}`
            );
        }
        renderForm(req, res);
    })
    .post(async (req, res, next) => {
        logger.info('Login attempted');

        /**
         * Key all rate-limited login attempts by
         * the user's IP and the attempted username
         */
        const LoginRateLimiter = await new RateLimiter(
            rateLimiterConfigs.failByUsername,
            [req.ip, req.body.username]
        ).init();

        if (LoginRateLimiter.isRateLimited()) {
            // User is rate limited
            const minutesLeft = LoginRateLimiter.minutesTillNextAllowedAttempt();
            return renderRateLimitError(req, res, minutesLeft);
        } else {
            passport.authenticate('local', async function (err, user) {
                if (err) {
                    logger.error('Authentication failed', err);
                    next(err);
                } else if (user) {
                    req.logIn(user, async function (loginErr) {
                        if (loginErr) {
                            logger.error(
                                'Login failed: Error with authentication',
                                loginErr
                            );
                            next(loginErr);
                        } else {
                            logger.info('Login succeeded');
                            // Reset rate limit on successful authorisation
                            if (LoginRateLimiter.hasConsumedPoints()) {
                                await LoginRateLimiter.clearRateLimit();
                            }

                            // Set a cookie to allow JavaScript components to toggle state for authed users
                            res.locals.setAuthCookie();

                            redirectUrlWithFallback(req, res, '/apply');
                        }
                    });
                } else {
                    /**
                     * User is invalid
                     * Show a generic error message here to avoid exposing account state
                     */
                    logger.warn('Login failed: Unsuccessful login attempt');
                    res.locals.hotJarTagList = [
                        'User: Unsuccessful login attempt',
                    ];
                    try {
                        await LoginRateLimiter.consumeRateLimit();
                        return renderForm(req, res, req.body, [
                            {
                                msg: req.i18n.__('user.login.credentialError'),
                            },
                        ]);
                    } catch (rateLimitRejection) {
                        if (rateLimitRejection instanceof Error) {
                            next(rateLimitRejection);
                        } else {
                            // User is rate limited
                            const minutesLeft = LoginRateLimiter.minutesTillNextAllowedAttempt();
                            return renderRateLimitError(req, res, minutesLeft);
                        }
                    }
                }
            })(req, res, next);
        }
    });

module.exports = router;
