'use strict';
const express = require('express');
const Sentry = require('@sentry/node');
const path = require('path');
const { concat } = require('lodash');

const { Users } = require('../../db/models');
const { localify } = require('../../common/urls');
const { requireUserAuth } = require('../../middleware/authed');

const sendActivationEmail = require('./lib/activation-email');
const { verifyTokenActivate } = require('./lib/jwt');

const router = express.Router();

router.route('/').get(requireUserAuth, async (req, res, next) => {
    const userUrl = localify(req.i18n.getLocale())('/user');
    if (req.user.is_active) {
        res.redirect(userUrl);
    } else if (req.query.token) {
        try {
            await verifyTokenActivate(req.query.token, req.user.id);
            await Users.activateUser(req.user.id);
            req.session.save(() => {
                res.redirect(`${userUrl}?s=activationComplete`);
            });
        } catch (error) {
            Sentry.captureException(error);
            res.locals.breadcrumbs = concat(res.locals.breadcrumbs, {
                label: 'Activate account'
            });
            res.render(path.resolve(__dirname, './views/activate-error'));
        }
    } else {
        try {
            await sendActivationEmail(req, req.user);
            req.session.save(() => {
                res.redirect(`${userUrl}?s=activationSent`);
            });
        } catch (err) {
            next(err);
        }
    }
});

module.exports = router;
