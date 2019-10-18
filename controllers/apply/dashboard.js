'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const isEmpty = require('lodash/isEmpty');

const { csrfProtection } = require('../../common/cached');
const { requireActiveUser } = require('../../common/authed');
const { injectCopy } = require('../../common/inject-content');
const { PendingApplication, SubmittedApplication } = require('../../db/models');
const { enrichPendingApplication, enrichSubmittedApplication } = require('./lib/enrich-application');

const router = express.Router();

/**
 * Determine the latest application to show and
 * prepare application data for display in the view.
 */
async function getLatestApplication(userId, locale) {
    const [pending, submitted] = await Promise.all([
        PendingApplication.findLatestByUserId(userId),
        SubmittedApplication.findLatestByUserId(userId)
    ]);

    if (pending && submitted) {
        if (moment(pending.updatedAt).isAfter(submitted.updatedAt)) {
            return enrichPendingApplication(pending, locale);
        } else {
            return enrichSubmittedApplication(submitted);
        }
    } else if (submitted) {
        return enrichSubmittedApplication(submitted);
    } else if (pending) {
        return enrichPendingApplication(pending, locale);
    }
}

router.get(
    '/',
    csrfProtection,
    requireActiveUser,
    injectCopy('applyNext'),
    async function(req, res, next) {
        try {
            /**
             * Check for existing pending applications
             * Used to determine if "start a new application" action card
             * is in a primary or secondary style.
             * Secondary if we have a pending application for the product
             */
            const [pendingSimple, pendingStandard] = await Promise.all([
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: 'awards-for-all'
                }),
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: 'standard-enquiry'
                })
            ]);

            const viewData = {
                title: 'Dashboard - Latest Application',
                latestApplication: await getLatestApplication(
                    req.user.userData.id,
                    req.i18n.getLocale()
                ),
                hasPendingSimpleApplication: !isEmpty(pendingSimple),
                hasPendingStandardApplication: !isEmpty(pendingStandard)
            };

            res.render(path.resolve(__dirname, './views/dashboard'), viewData);
        } catch (err) {
            next(err);
        }
    }
);

router.get(
    '/all',
    csrfProtection,
    requireActiveUser,
    injectCopy('applyNext'),
    async function(req, res, next) {
        try {
            const [
                pendingApplications,
                submittedApplications
            ] = await Promise.all([
                PendingApplication.findAllByUserId(req.user.userData.id),
                SubmittedApplication.findAllByUserId(req.user.userData.id)
            ]);

            res.json({
                title: 'Dashboard - All Applications',
                pendingApplications: pendingApplications.map(application => {
                    enrichPendingApplication(application, req.i18n.getLocale());
                }),
                submittedApplications: submittedApplications.map(application => {
                    enrichSubmittedApplication(application);
                })
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
