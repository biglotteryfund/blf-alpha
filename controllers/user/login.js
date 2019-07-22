'use strict';
const path = require('path');
const express = require('express');
const passport = require('passport');

const logger = require('../../common/logger').child({
    service: 'user'
});

const {
    availableRateLimiters,
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

function renderRateLimitError(req, res) {
    res.status(429).render(
        path.resolve(__dirname, './views/error-rate-limit'),
        {
            title: 'Too many requests'
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
        const uniqueKey = `${req.ip}_${req.body.username}`;

        const LoginRateLimiter = await new RateLimiter(
            availableRateLimiters.failByUsername,
            uniqueKey
        ).init();

        if (LoginRateLimiter.isRateLimited()) {
            // User is rate limited
            return renderRateLimitError(req, res);
        } else {
            passport.authenticate('local', async function(err, user) {
                if (err) {
                    logger.error('Authentication failed', err);
                    next(err);
                } else if (user) {
                    req.logIn(user, async function(loginErr) {
                        if (loginErr) {
                            logger.error('Login failed', loginErr);
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
                    logger.warn('Login failed: invalid credentials');
                    try {
                        await LoginRateLimiter.consumeRateLimit();
                        return renderForm(req, res, req.body, [
                            {
                                msg: `Your username and password combination is invalid`
                            }
                        ]);
                    } catch (rlRejected) {
                        if (rlRejected instanceof Error) {
                            next(rlRejected);
                        } else {
                            // User is rate limited
                            return renderRateLimitError(req, res);
                        }
                    }
                }
            })(req, res, next);
        }
    });

module.exports = router;
