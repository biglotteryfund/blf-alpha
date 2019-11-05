'use strict';
const path = require('path');
const express = require('express');
const has = require('lodash/has');
const omit = require('lodash/omit');
const Sentry = require('@sentry/node');
const crypto = require('crypto');

const logger = require('../../../common/logger');
const { sanitiseRequestBody } = require('../../../common/sanitise');
const { PendingApplication } = require('../../../db/models');
const { prepareFilesForUpload, scanAndUpload } = require('./lib/file-uploads');

function anonymiseId(id) {
    return crypto
        .createHash('md5')
        .update(id)
        .digest('hex');
}

module.exports = function(formId, formBuilder) {
    const router = express.Router();

    function renderStepFor(sectionSlug, stepNumber) {
        return async function(req, res, data, errors = []) {
            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: data
            });

            const section = form.findSectionBySlug(sectionSlug);

            if (!section) {
                return res.redirect(res.locals.formBaseUrl);
            }

            if (!stepNumber) {
                return res.redirect(
                    `${res.locals.formBaseUrl}/${section.slug}/1`
                );
            }

            const stepIndex = parseInt(stepNumber, 10) - 1;
            const step = section.steps[stepIndex];

            if (!step) {
                return res.redirect(res.locals.formBaseUrl);
            }

            const { nextPage, previousPage } = form.pagination({
                baseUrl: res.locals.formBaseUrl,
                sectionSlug: req.params.section,
                currentStepIndex: stepIndex,
                copy: res.locals.copy
            });

            if (step.isRequired) {
                const application = await PendingApplication.lastUpdatedTime(
                    res.locals.currentlyEditingId
                );

                /**
                 * Log validation errors along with section and step metadata
                 */
                if (errors.length > 0) {
                    res.locals.hotJarTagList = [
                        'App: User shown form error after submitting'
                    ];

                    errors.forEach(item => {
                        logger.info(item.msg, {
                            service: 'step-validations',
                            formId: formId,
                            fieldName: item.param,
                            section: section.slug,
                            step: stepNumber,
                            errorType: item.type,
                            joiErrorType: item.joiType,
                            applicationId: anonymiseId(
                                res.locals.currentlyEditingId
                            )
                        });
                    });
                }

                res.render(path.resolve(__dirname, './views/step'), {
                    form: form,
                    csrfToken: req.csrfToken(),
                    section: section,
                    step: step,
                    stepNumber: stepNumber,
                    totalSteps: section.steps.length,
                    previousPage: previousPage,
                    nextPage: nextPage,
                    errors: errors,
                    updatedAt: application.updatedAt
                });
            } else {
                res.redirect(nextPage.url);
            }
        };
    }

    router
        .route('/:section/:step?')
        .get((req, res) => {
            const renderStep = renderStepFor(
                req.params.section,
                req.params.step
            );
            renderStep(req, res, res.locals.currentApplicationData);
        })
        .post(async (req, res, next) => {
            const {
                copy,
                currentlyEditingId,
                currentApplicationData
            } = res.locals;

            const sanitisedBody = sanitiseRequestBody(
                omit(req.body, ['_csrf'])
            );

            const applicationData = {
                ...currentApplicationData,
                ...sanitisedBody
            };

            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: applicationData
            });

            const stepIndex = parseInt(req.params.step, 10) - 1;
            const step = form.getStep(req.params.section, stepIndex);
            const stepFields = form.getCurrentFieldsForStep(
                req.params.section,
                stepIndex
            );

            const preparedFiles = prepareFilesForUpload(stepFields, req.files);

            /**
             * Re-validate form against combined application data
             * currentApplication data with req.body
             * and file metadata mixed in.
             */
            const validationResult = form.validate({
                ...applicationData,
                ...preparedFiles.valuesByField
            });

            const errorsForStep = validationResult.messages.filter(item =>
                stepFields.map(f => f.name).includes(item.param)
            );

            function isPaginationLinks() {
                return has(req.body, 'previousBtn') || has(req.body, 'nextBtn');
            }

            function shouldRenderErrors() {
                return (
                    errorsForStep.length > 0 && isPaginationLinks() === false
                );
            }

            function determineRedirectUrl() {
                const { previousPage, nextPage } = form.pagination({
                    baseUrl: res.locals.formBaseUrl,
                    sectionSlug: req.params.section,
                    currentStepIndex: stepIndex,
                    copy: res.locals.copy
                });

                return req.body.previousBtn ? previousPage.url : nextPage.url;
            }

            try {
                let dataToStore = validationResult.value;
                const currentProgressState = form.progress.isComplete
                    ? 'COMPLETE'
                    : 'PENDING';

                // Determine whether there were any uploaded files with errors
                // and if so, remove them from the data object before storage
                // so we don't record an invalid file in the database
                if (errorsForStep.length > 0) {
                    const uploadedFieldNamesWithErrors = Object.keys(
                        preparedFiles.valuesByField
                    ).filter(fieldName =>
                        errorsForStep.map(e => e.param).includes(fieldName)
                    );
                    dataToStore = omit(
                        dataToStore,
                        uploadedFieldNamesWithErrors
                    );
                }

                /**
                 * Store the form's current state (errors and all) in the database
                 */
                await PendingApplication.saveApplicationState(
                    currentlyEditingId,
                    dataToStore,
                    currentProgressState
                );

                /**
                 * If there are errors re-render the step with errors only if prev/next btn is not clicked
                 * - Pass the full data object from validationResult to the view. Including invalid values.
                 * Otherwise, find the next suitable step and redirect there.
                 */
                if (shouldRenderErrors()) {
                    const renderStep = renderStepFor(
                        req.params.section,
                        req.params.step
                    );

                    renderStep(req, res, validationResult.value, errorsForStep);
                } else {
                    /**
                     * Run any pre-flight checks for this steps
                     * eg. custom validations which don't run in Joi
                     */
                    if (step.preFlightCheck && isPaginationLinks() === false) {
                        try {
                            await step.preFlightCheck(dataToStore);
                        } catch (errors) {
                            // There was a validation error, so return users to the form
                            const renderStep = renderStepFor(
                                req.params.section,
                                req.params.step
                            );
                            return renderStep(
                                req,
                                res,
                                validationResult.value,
                                errors
                            );
                        }
                    }

                    /**
                     * Handle file uploads if we have any for the step
                     */
                    if (preparedFiles.filesToUpload.length > 0) {
                        try {
                            await Promise.all(
                                preparedFiles.filesToUpload.map(file => {
                                    return scanAndUpload({
                                        formId: formId,
                                        applicationId: currentlyEditingId,
                                        fileMetadata: file
                                    });
                                })
                            );
                            res.redirect(determineRedirectUrl());
                        } catch (rejection) {
                            Sentry.captureException(rejection.error);

                            const renderStep = renderStepFor(
                                req.params.section,
                                req.params.step
                            );

                            const uploadError = {
                                msg: copy.common.errorUploading,
                                param: rejection.fieldName
                            };

                            return renderStep(
                                req,
                                res,
                                validationResult.value,
                                [uploadError]
                            );
                        }
                    } else {
                        res.redirect(determineRedirectUrl());
                    }
                }
            } catch (storageError) {
                next(storageError);
            }
        });

    return router;
};
