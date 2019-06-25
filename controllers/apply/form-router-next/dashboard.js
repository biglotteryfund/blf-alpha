'use strict';
const express = require('express');
const path = require('path');
const get = require('lodash/get');

const {
    PendingApplication,
    SubmittedApplication
} = require('../../../db/models');

module.exports = function(formId, formBuilder) {
    const router = express.Router();

    router.route('/').get(async function(req, res, next) {
        function actionUrl(application, action) {
            return `${res.locals.formBaseUrl}/${action}/${application.id}`;
        }

        function enrichPendingApplication(application) {
            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: get(application, 'applicationData')
            });

            application.summary = form.summary;
            application.progress = form.progress;

            application.editUrl = actionUrl(application, 'edit');
            application.deleteUrl = actionUrl(application, 'delete');

            return application;
        }

        try {
            const [
                pendingApplications,
                submittedApplications
            ] = await Promise.all([
                PendingApplication.findAllByForm({
                    userId: req.user.userData.id,
                    formId: formId
                }),
                SubmittedApplication.findAllByForm({
                    userId: req.user.userData.id,
                    formId: formId
                })
            ]);

            // @TODO i18n
            res.locals.userNavigationLinks = [
                {
                    url: req.baseUrl,
                    label: 'Your Applications'
                }
            ];

            res.render(path.resolve(__dirname, './views/dashboard'), {
                title: res.locals.formTitle,
                pendingApplications: pendingApplications.map(
                    enrichPendingApplication
                ),
                submittedApplications: submittedApplications
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
};
