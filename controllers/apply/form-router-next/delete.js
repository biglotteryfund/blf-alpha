'use strict';
const express = require('express');
const path = require('path');

const { PendingApplication } = require('../../../db/models');
const logger = require('../../../common/logger').child({ service: 'apply' });

module.exports = function(formId) {
    const router = express.Router();

    router
        .route('/:applicationId')
        .get(async function(req, res) {
            if (req.params.applicationId && req.user) {
                logger.debug(
                    `Looking up application ${req.params.applicationId}`
                );

                const application = await PendingApplication.findApplicationForForm(
                    {
                        formId: formId,
                        applicationId: req.params.applicationId,
                        userId: req.user.userData.id
                    }
                );

                if (application) {
                    res.render(path.resolve(__dirname, './views/delete'), {
                        title: res.locals.copy.delete.title,
                        csrfToken: req.csrfToken()
                    });
                } else {
                    logger.debug(
                        `Failed to find application for ${req.params.applicationId}`
                    );
                    return res.redirect(res.locals.formBaseUrl);
                }
            } else {
                res.redirect(res.locals.formBaseUrl);
            }
        })
        .post(async function(req, res, next) {
            try {
                await PendingApplication.deleteApplication(
                    req.params.applicationId,
                    req.user.userData.id
                );

                logger.info('Application deleted', {
                    applicationId: req.params.applicationId
                });
                res.redirect(res.locals.formBaseUrl + '?s=applicationDeleted');
            } catch (error) {
                next(error);
            }
        });

    return router;
};
