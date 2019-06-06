'use strict';
const express = require('express');
const path = require('path');

const { PendingApplication } = require('../../../db/models');

module.exports = function(formId) {
    const router = express.Router();

    router
        .route('/:applicationId')
        .get(async function(req, res) {
            if (req.params.applicationId && req.user) {
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
                        breadcrumbs: res.locals.breadcrumbs.concat([
                            { label: res.locals.copy.delete.title }
                        ]),
                        csrfToken: req.csrfToken()
                    });
                } else {
                    return res.redirect(res.locals.formBaseUrl);
                }
            } else {
                res.redirect(res.locals.formBaseUrl);
            }
        })
        .post(async (req, res, next) => {
            try {
                await PendingApplication.deleteApplication(
                    req.params.applicationId,
                    req.user.userData.id
                );

                res.redirect(res.locals.formBaseUrl);
            } catch (error) {
                next(error);
            }
        });

    return router;
};
