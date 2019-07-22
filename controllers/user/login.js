'use strict';
const path = require('path');
const express = require('express');
const passport = require('passport');

const logger = require('../../common/logger').child({
    service: 'user'
});

const {
    rateLimiterConfigs,
    RateLimiter
} = require('../../middleware/rate-limiter');

const {
    injectCopy,
    injectBreadcrumbs
} = require('../../middleware/inject-content');
const {
    requireNoAuth,
    redirectUrlWithFallback
} = require('../../middleware/authed');
const { csrfProtection } = require('../../middleware/cached');

const alertMessage = require('./lib/alert-message');

const router = express.Router();

function renderForm(req, res, formValues = null, errors = []) {
    res.render(path.resolve(__dirname, './views/login'), {
        csrfToken: req.csrfToken(),
        formValues: formValues,
        errors: errors
    });
}

function renderRateLimitError(req, res, minutesLeft) {
    res.status(429).render(
        path.resolve(__dirname, './views/error-rate-limit'),
        {
            title: 'Too many requests',
            minutesLeft: minutesLeft
        }
    );
}

router
    .route('/')
    .all(
        csrfProtection,
        requireNoAuth,
        injectCopy('user.login'),
        injectBreadcrumbs
    )
    .get(function(req, res) {
        res.locals.alertMessage = alertMessage({
            locale: req.i18n.getLocale(),
            status: req.query.s
        });
        renderForm(req, res);
    })
    .post(async (req, res, next) => {
        logger.info('Login attempted');

        // Key all rate-limited login attempts by the user's IP and the attempted username
        const RATE_LIMIT_UNIQUE_KEY = `${req.ip}_${req.body.username}`;

        const LoginRateLimiter = await new RateLimiter(
            rateLimiterConfigs.failByUsername,
            RATE_LIMIT_UNIQUE_KEY
        ).init();

        if (LoginRateLimiter.isRateLimited()) {
            // User is rate limited
            const minutesLeft = LoginRateLimiter.minutesTillNextAllowedAttempt();
            return renderRateLimitError(req, res, minutesLeft);
        } else {
            passport.authenticate('local', async function(err, user) {
                if (err) {
                    logger.error('Authentication failed', err);
                    next(err);
                } else if (user) {
                    req.logIn(user, async function(loginErr) {
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
                            redirectUrlWithFallback(req, res, '/user');
                        }
                    });
                } else {
                    /**
                     * User is invalid
                     * Show a generic error message here to avoid exposing account state
                     */
                    logger.warn('Login failed: Unsuccessful login attempt');
                    try {
                        await LoginRateLimiter.consumeRateLimit();
                        return renderForm(req, res, req.body, [
                            {
                                msg: `Your username and password combination is invalid`
                            }
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
