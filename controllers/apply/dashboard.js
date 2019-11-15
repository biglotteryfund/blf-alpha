'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const isEmpty = require('lodash/isEmpty');

const { localify } = require('../../common/urls');
const { noStore } = require('../../common/cached');
const { requireActiveUser } = require('../../common/authed');
const { PendingApplication, SubmittedApplication } = require('../../db/models');
const { enrichPending, enrichSubmitted } = require('./lib/enrich-application');

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

function injectNavigationLinks(req, res, next) {
    res.locals.userNavigationLinks = [
        {
            url: req.baseUrl,
            label: req.i18n.__('applyNext.navigation.latestApplication')
        },
        {
            url: `${req.baseUrl}/all`,
            label: req.i18n.__('applyNext.navigation.allApplications')
        },
        {
            url: localify(req.i18n.getLocale())('/user'),
            label: req.i18n.__('applyNext.navigation.account')
        }
    ];

    next();
}

router.get(
    '/',
    noStore,
    requireActiveUser,
    injectNavigationLinks,
    async function(req, res, next) {
        const copy = req.i18n.__('applyNext.dashboardNew');

        try {
            /**
             * Check for existing pending applications
             * Used to determine if "start a new application" action card
             * is in a primary or secondary style.
             * Secondary if we have a pending application for the product
             */
            const [
                latestApplication,
                pendingSimple,
                pendingStandard
            ] = await Promise.all([
                getLatestApplication(req.user.id, req.i18n.getLocale()),
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
                copy: copy,
                title: copy.latest.title,
                latestApplication: latestApplication,
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
    injectNavigationLinks,
    async function(req, res, next) {
        const copy = req.i18n.__('applyNext.dashboardNew');

        try {
            const [
                pendingApplications,
                submittedApplications
            ] = await Promise.all([
                PendingApplication.findAllByUserId(req.user.id),
                SubmittedApplication.findAllByUserId(req.user.id)
            ]);

            if (req.query.s === 'applicationDeleted') {
                res.locals.alertMessage = copy.applicationDeleted;
                res.locals.hotJarTagList = ['User deleted an application'];
            }

            res.render(path.resolve(__dirname, './views/dashboard-all'), {
                copy: copy,
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
