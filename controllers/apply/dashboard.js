'use strict';
const express = require('express');
const get = require('lodash/fp/get');
const isEmpty = require('lodash/isEmpty');
const moment = require('moment');

const { csrfProtection } = require('../../common/cached');
const { requireActiveUser } = require('../../common/authed');
const { injectCopy } = require('../../common/inject-content');
const { PendingApplication, SubmittedApplication } = require('../../db/models');

const awardsForAllFormBuilder = require('./awards-for-all/form');
const getAdviceFormBuilder = require('./get-advice/form');

const router = express.Router();

router.get(
    '/',
    csrfProtection,
    requireActiveUser,
    injectCopy('applyNext'),
    async function(req, res, next) {
        function formBuilderFor(formId) {
            return formId === 'standard-enquiry'
                ? getAdviceFormBuilder
                : awardsForAllFormBuilder;
        }

        function enrichPendingApplication(application) {
            const form = formBuilderFor(application.formId)({
                locale: req.i18n.getLocale(),
                data: get('applicationData')(application)
            });

            application.summary = form.summary;
            application.progress = form.progress;

            return application;
        }

        function latestApplication(latestPending, latestSubmitted) {
            if (moment(latestPending.updatedAt).isAfter(latestSubmitted.updatedAt)) {
                return enrichPendingApplication(latestPending);
            } else {
                return latestSubmitted;
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

            res.json({
                title: 'Dashboard',
                latestApplication: latestApplication(latestPending, latestSubmitted),
                everAppliedForSimple: !isEmpty(pendingSimpleApps) || !isEmpty(submittedSimpleApps),
                everAppliedForStandard: !isEmpty(pendingStandardApps) || !isEmpty(submittedStandardApps)
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
