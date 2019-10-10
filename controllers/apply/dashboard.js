'use strict';
const path = require('path');
const express = require('express');
const get = require('lodash/fp/get');

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
    async function(req, res) {
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

        try {
            const [latestPending, latestSubmitted] = await Promise.all([
                PendingApplication.findLatestByUserId(req.user.userData.id),
                SubmittedApplication.findLatestByUserId(req.user.userData.id)
            ]);

            res.render(path.resolve(__dirname, './views/dashboard-new.njk'), {
                title: 'Dashboard',
                latestPending: enrichPendingApplication(latestPending),
                latestSubmitted: latestSubmitted
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
