'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const isEmpty = require('lodash/isEmpty');

const { localify } = require('../../common/urls');
const { noStore } = require('../../common/cached');
const { requireActiveUser } = require('../../common/authed');
const { injectCopy } = require('../../common/inject-content');
const { PendingApplication, SubmittedApplication } = require('../../db/models');
const { enrichPending, enrichSubmitted } = require('./lib/enrich-application');

const router = express.Router();

function injectNavigationLinks(req, res, next) {
    res.locals.userNavigationLinks = [
        {
            url: req.baseUrl,
            label: 'Latest application'
        },
        {
            url: `${req.baseUrl}/all`,
            label: 'All applications'
        },
        {
            url: localify(req.i18n.getLocale())('/user'),
            label: 'Account'
        }
    ];

    next();
}

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
            return enrichPending(pending, locale);
        } else {
            return enrichSubmitted(submitted, locale);
        }
    } else if (submitted) {
        return enrichSubmitted(submitted, locale);
    } else if (pending) {
        return enrichPending(pending, locale);
    }
}

router.get(
    '/',
    noStore,
    requireActiveUser,
    injectCopy('applyNext.dashboardNew'),
    injectNavigationLinks,
    async function(req, res, next) {
        const { copy } = res.locals;

        try {
            /**
             * Check for existing pending applications
             * Used to determine if "start a new application" action card
             * is in a primary or secondary style.
             * Secondary if we have a pending application for the product
             */
            const [pendingSimple, pendingStandard] = await Promise.all([
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.id,
                    formId: 'awards-for-all'
                }),
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.id,
                    formId: 'standard-enquiry'
                })
            ]);

            res.render(path.resolve(__dirname, './views/dashboard'), {
                title: copy.latest.title,
                latestApplication: await getLatestApplication(
                    req.user.id,
                    req.i18n.getLocale()
                ),
                hasPendingSimpleApplication: !isEmpty(pendingSimple),
                hasPendingStandardApplication: !isEmpty(pendingStandard)
            });
        } catch (err) {
            next(err);
        }
    }
);

router.get(
    '/all',
    noStore,
    requireActiveUser,
    injectCopy('applyNext.dashboardNew'),
    injectNavigationLinks,
    async function(req, res, next) {
        const { copy } = res.locals;

        try {
            const [
                pendingApplications,
                submittedApplications
            ] = await Promise.all([
                PendingApplication.findAllByUserId(req.user.id),
                SubmittedApplication.findAllByUserId(req.user.id)
            ]);

            res.render(path.resolve(__dirname, './views/dashboard-all'), {
                title: copy.all.title,
                pendingApplications: pendingApplications.map(application =>
                    enrichPending(application, req.i18n.getLocale())
                ),
                submittedApplications: submittedApplications.map(application =>
                    enrichSubmitted(application, req.i18n.getLocale())
                )
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
