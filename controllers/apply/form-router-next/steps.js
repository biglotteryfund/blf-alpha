'use strict';
const path = require('path');
const express = require('express');
const concat = require('lodash/concat');
const findIndex = require('lodash/findIndex');
const Sentry = require('@sentry/node');

const { PendingApplication } = require('../../../db/models');

const { prepareFilesForUpload, uploadFile } = require('./lib/file-uploads');

module.exports = function(formId, formBuilder) {
    const router = express.Router();

    function renderStepFor(sectionSlug, stepNumber) {
        return function(req, res, data, errors = []) {
            const form = formBuilder({
                locale: req.i18n.getLocale(),
                data: data
            });

            const sectionIndex = findIndex(
                form.sections,
                s => s.slug === sectionSlug
            );

            const section = form.sections[sectionIndex];

            if (section) {
                const sectionShortTitle = section.shortTitle
                    ? section.shortTitle
                    : section.title;

                const sectionUrl = `${res.locals.formBaseUrl}/${section.slug}`;

                if (stepNumber) {
                    const stepIndex = parseInt(stepNumber, 10) - 1;
                    const step = section.steps[stepIndex];

                    if (step) {
                        const { nextPage, previousPage } = form.pagination({
                            baseUrl: res.locals.formBaseUrl,
                            sectionSlug: req.params.section,
                            currentStepIndex: stepIndex
                        });

                        if (step.isRequired) {
                            const viewData = {
                                csrfToken: req.csrfToken(),
                                breadcrumbs: concat(
                                    res.locals.breadcrumbs,
                                    {
                                        label: sectionShortTitle,
                                        url: sectionUrl
                                    },
                                    { label: step.title }
                                ),
                                section: section,
                                step: step,
                                stepIsMultipart: step.isMultipart,
                                stepNumber: stepNumber,
                                totalSteps: section.steps.length,
                                previousPage: previousPage,
                                nextPage: nextPage,
                                errors: errors
                            };

                            res.render(
                                path.resolve(__dirname, './views/step'),
                                viewData
                            );
                        } else {
                            res.redirect(nextPage.url);
                        }
                    } else {
                        res.redirect(res.locals.formBaseUrl);
                    }
                } else {
                    res.redirect(`${sectionUrl}/1`);
                }
            } else {
                res.redirect(res.locals.formBaseUrl);
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

            const applicationData = {
                ...currentApplicationData,
                ...req.body
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

            try {
                /**
                 * Store the form's current state (errors and all) in the database
                 */
                await PendingApplication.saveApplicationState(
                    currentlyEditingId,
                    validationResult.value
                );

                /**
                 * If there are errors re-render the step with errors
                 * - Pass the full data object from validationResult to the view. Including invalid values.
                 * Otherwise, find the next suitable step and redirect there.
                 */
                if (errorsForStep.length > 0) {
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
                    if (step.preflightCheck) {
                        try {
                            await step.preflightCheck();
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

                    const { nextPage } = form.pagination({
                        baseUrl: res.locals.formBaseUrl,
                        sectionSlug: req.params.section,
                        currentStepIndex: stepIndex
                    });

                    /**
                     * Handle file uploads if we have any for the step
                     */
                    if (preparedFiles.filesToUpload.length > 0) {
                        try {
                            await Promise.all(
                                preparedFiles.filesToUpload.map(file =>
                                    uploadFile({
                                        formId: formId,
                                        applicationId: currentlyEditingId,
                                        fileMetadata: file
                                    })
                                )
                            );
                            res.redirect(nextPage.url);
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
                        res.redirect(nextPage.url);
                    }
                }
            } catch (storageError) {
                next(storageError);
            }
        });

    return router;
};
