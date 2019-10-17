'use strict';
const path = require('path');
const express = require('express');
const moment = require('moment');
const get = require('lodash/fp/get');
const getOr = require('lodash/fp/getOr');
const isEmpty = require('lodash/isEmpty');
const sumBy = require('lodash/sumBy');

const { csrfProtection } = require('../../common/cached');
const { requireActiveUser } = require('../../common/authed');
const { injectCopy } = require('../../common/inject-content');
const { PendingApplication, SubmittedApplication } = require('../../db/models');

const awardsForAllFormBuilder = require('./awards-for-all/form');
const getAdviceFormBuilder = require('./get-advice/form');

const router = express.Router();

function formBuilderFor(formId) {
    return formId === 'standard-enquiry'
        ? getAdviceFormBuilder
        : awardsForAllFormBuilder;
}

function enrichPendingApplication(application, locale) {
    const form = formBuilderFor(application.formId)({
        locale: locale,
        data: get('applicationData')(application)
    });

    const localise = get(locale);

    return {
        type: 'pending',
        projectName: getOr(
            localise({ en: 'Untitled application', cy: 'Cais heb deitl' }),
            'projectName'
        )(application.applicationData),
        amountRequested: `£${sumBy(
            getOr([], 'projectBudget', application.applicationData),
            item => parseInt(item.cost, 10) || 0
        ).toLocaleString()}`,
        overview: [
            {
                label: 'Project dates',
                value: '2 December, 2020–2 December, 2020'
            },
            {
                label: 'Location',
                value: 'Sutton Coldfield'
            },
            {
                label: 'Organisation',
                value: 'The Scouts of Sutton Coldfield'
            }
        ],
        progress: form.progress,
        expiresAt: application.expiresAt,
        updatedAt: application.updatedAt
    };
}

function enrichSubmittedApplication(application) {
    return {
        type: 'submitted',
        projectName: 'Scout hut extension for The Scouts of Sutton Coldfield',
        amountRequested: '£8,500',
        overview: [
            {
                label: 'Project dates',
                value: '2 December, 2020–2 December, 2020'
            },
            {
                label: 'Location',
                value: 'Sutton Coldfield'
            },
            {
                label: 'Organisation',
                value: 'The Scouts of Sutton Coldfield'
            }
        ],
        submittedAt: '2019-10-15T15:35:31.433Z'
    };
}

router.get(
    '/',
    csrfProtection,
    requireActiveUser,
    injectCopy('applyNext'),
    async function(req, res, next) {
        function latestApplication(latestPending, latestSubmitted) {
            if (
                moment(latestPending.updatedAt).isAfter(
                    latestSubmitted.updatedAt
                )
            ) {
                return enrichPendingApplication(
                    latestPending,
                    req.i18n.getLocale()
                );
            } else {
                return enrichSubmittedApplication(latestSubmitted);
            }
        }

        try {
            const [latestPending, latestSubmitted] = await Promise.all([
                PendingApplication.findLatestByUserId(req.user.userData.id),
                SubmittedApplication.findLatestByUserId(req.user.userData.id)
            ]);

            const [
                pendingSimpleApps,
                submittedSimpleApps,
                pendingStandardApps,
                submittedStandardApps
            ] = await Promise.all([
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: 'awards-for-all'
                }),
                SubmittedApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: 'awards-for-all'
                }),
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: 'standard-enquiry'
                }),
                SubmittedApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: 'standard-enquiry'
                })
            ]);

            res.render(path.resolve(__dirname, './views/dashboard'), {
                title: 'Dashboard - Latest Application',
                latestApplication: latestApplication(
                    latestPending,
                    latestSubmitted
                ),
                everAppliedForSimple:
                    !isEmpty(pendingSimpleApps) ||
                    !isEmpty(submittedSimpleApps),
                everAppliedForStandard:
                    !isEmpty(pendingStandardApps) ||
                    !isEmpty(submittedStandardApps)
            });
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
                    enrichPendingApplication(req.i18n.getLocale(), application);
                }),
                submittedApplications: submittedApplications
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
