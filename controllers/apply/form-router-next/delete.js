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
            const { applicationId } = req.params;

            if (applicationId && req.user) {
                const application = await PendingApplication.findForUser({
                    formId: formId,
                    applicationId: applicationId,
                    userId: req.user.id
                });

                if (application) {
                    res.render(path.resolve(__dirname, './views/delete'), {
                        title: res.locals.copy.delete.title,
                        csrfToken: req.csrfToken()
                    });
                } else {
                    return res.redirect(res.locals.sectionUrl);
                }
            } else {
                res.redirect(res.locals.sectionUrl);
            }
        })
        .post(async function(req, res, next) {
            const { applicationId } = req.params;

            try {
                await PendingApplication.delete(applicationId, req.user.id);

                logger.info('Application deleted', { formId, applicationId });

                res.redirect(
                    `${res.locals.sectionUrl}/all?s=applicationDeleted`
                );
            } catch (error) {
                next(error);
            }
        });

    return router;
};
