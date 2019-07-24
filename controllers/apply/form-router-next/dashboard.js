'use strict';
const express = require('express');
const path = require('path');
const get = require('lodash/get');

const {
    PendingApplication,
    SubmittedApplication
} = require('../../../db/models');
const { localify } = require('../../../common/urls');
const alertMessage = require('../../../common/alert-message');

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
                PendingApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: formId
                }),
                SubmittedApplication.findUserApplicationsByForm({
                    userId: req.user.userData.id,
                    formId: formId
                })
            ]);

            // @TODO i18n
            res.locals.userNavigationLinks = [
                {
                    url: req.baseUrl,
                    label: 'Applications'
                },
                {
                    url: localify(req.i18n.getLocale())('/user'),
                    label: 'Account'
                },
                {
                    url: localify(req.i18n.getLocale())('/user/logout'),
                    label: 'Log out'
                }
            ];

            res.locals.alertMessage = alertMessage({
                locale: req.i18n.getLocale(),
                status: req.query.s
            });

            if (req.query.s === 'applicationDeleted') {
                res.locals.hotJarTagList = [
                    'Apply: AFA: User deleted an application'
                ];
            }

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
