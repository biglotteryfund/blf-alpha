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

function logErrors({ errors, formId, applicationId, sectionSlug, stepNumber }) {
    errors.forEach(item => {
        logger.info(item.msg, {
            service: 'step-validations',
            formId: formId,
            fieldName: item.param,
            section: sectionSlug,
            step: stepNumber,
            errorType: item.type,
            joiErrorType: item.joiType,
            applicationId: anonymiseId(applicationId)
        });
    });
}

module.exports = function(formId, formBuilder) {
    const router = express.Router();

    async function renderStep({
        req,
        res,
        sectionSlug,
        stepNumber,
        currentApplicationData,
        errors = []
    }) {
        const locale = req.i18n.getLocale();

        const form = formBuilder({
            locale: locale,
            data: currentApplicationData
        });

        const section = form.getSection(sectionSlug);

        /**
         * Alias for fallback URL
         * sectionUrl here is the top-level section
         * i.e. /apply/ rather than the current form section.
         */
        const fallbackUrl = res.locals.sectionUrl;

        if (!section) {
            return res.redirect(fallbackUrl);
        }

        /**
         * If we have a section but no step number then
         * redirect to the first step in the section.
         */
        if (!stepNumber) {
            return res.redirect(`${res.locals.formBaseUrl}/${section.slug}/1`);
        }

        const stepIndex = parseInt(stepNumber, 10) - 1;
        const step = section.steps[stepIndex];

        if (!step) {
            return res.redirect(fallbackUrl);
        }

        const { nextPage, previousPage } = form.pagination({
            baseUrl: res.locals.formBaseUrl,
            sectionSlug: req.params.section,
            currentStepIndex: stepIndex,
            copy: res.locals.copy
        });

        const stepCount = req.i18n.__(
            'global.misc.stepProgress',
            stepNumber,
            section.steps.length
        );

        function stepTitle() {
            return [
                `${step.title} (${stepCount})`,
                section.shortTitle || section.title,
                res.locals.formTitle
            ].join(' | ');
        }

        function hotJarTagList() {
            if (errors.length > 0) {
                return ['App: User shown form error after submitting'];
            } else {
                return [];
            }
        }

        const viewData = {
            title: stepTitle(),
            form: form,
            csrfToken: req.csrfToken(),
            section: section,
            step: step,
            stepNumber: stepNumber,
            stepCount: stepCount,
            previousPage: previousPage,
            nextPage: nextPage,
            errors: errors,
            hotJarTagList: hotJarTagList()
        };

        /**
         * Log validation errors along with section and step metadata
         */
        if (step.isRequired && errors.length > 0) {
            logErrors({
                errors: errors,
                formId: formId,
                applicationId: res.locals.currentlyEditingId,
                sectionSlug: section.slug,
                stepNumber: stepNumber
            });
        }

        /**
         * Allow custom steps with their own render functions
         */
        if (step.type === 'custom' && typeof step.render === 'function') {
            step.render(req, res, viewData);
        } else if (step.isRequired) {
            viewData.updatedAt = await PendingApplication.findLastUpdatedAt(
                res.locals.currentlyEditingId
            );

            res.render(path.resolve(__dirname, './views/step'), viewData);
        } else {
            res.redirect(nextPage.url);
        }
    }

    async function handleSubmission(req, res, next) {
        const sanitisedBody = sanitiseRequestBody(omit(req.body, ['_csrf']));

        const applicationData = {
            ...res.locals.currentApplicationData,
            ...sanitisedBody
        };

        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: applicationData
        });

        const stepIndex = parseInt(req.params.step, 10) - 1;
        const step = form.getStep(req.params.section, stepIndex);

        const preparedFiles = prepareFilesForUpload(
            step.getCurrentFields(),
            req.files
        );

        /**
         * Re-validate form against combined application data
         * currentApplication data with req.body
         * and file metadata mixed in.
         */
        const validationResult = form.validate({
            ...applicationData,
            ...preparedFiles.valuesByField
        });

        const errorsForStep = step.filterErrors(validationResult.messages);

        function isPaginationLinks() {
            return has(req.body, 'previousBtn') || has(req.body, 'nextBtn');
        }

        function shouldRenderErrors() {
            return errorsForStep.length > 0 && isPaginationLinks() === false;
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
                dataToStore = omit(dataToStore, uploadedFieldNamesWithErrors);
            }

            /**
             * Store the form's current state (errors and all) in the database
             */
            await PendingApplication.saveApplicationState(
                res.locals.currentlyEditingId,
                dataToStore,
                currentProgressState
            );

            /**
             * If there are errors re-render the step with errors only if prev/next btn is not clicked
             * - Pass the full data object from validationResult to the view. Including invalid values.
             * Otherwise, find the next suitable step and redirect there.
             */
            if (shouldRenderErrors()) {
                await renderStep({
                    req: req,
                    res: res,
                    sectionSlug: req.params.section,
                    stepNumber: req.params.step,
                    currentApplicationData: validationResult.value,
                    errors: errorsForStep
                });
            } else {
                /**
                 * Run any pre-flight checks for this steps
                 * eg. custom validations which don't run in Joi
                 */
                if (step.preFlightCheck && isPaginationLinks() === false) {
                    try {
                        await step.preFlightCheck(dataToStore);
                    } catch (preflightErrors) {
                        return renderStep({
                            req: req,
                            res: res,
                            sectionSlug: req.params.section,
                            stepNumber: req.params.step,
                            currentApplicationData: validationResult.value,
                            errors: preflightErrors
                        });
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
                                    applicationId:
                                        res.locals.currentlyEditingId,
                                    fileMetadata: file
                                });
                            })
                        );
                        res.redirect(determineRedirectUrl());
                    } catch (rejection) {
                        Sentry.captureException(rejection.error);

                        const uploadError = {
                            msg: req.i18n.__('applyNext.common.errorUploading'),
                            param: rejection.fieldName
                        };

                        await renderStep({
                            req: req,
                            res: res,
                            sectionSlug: req.params.section,
                            stepNumber: req.params.step,
                            currentApplicationData: validationResult.value,
                            errors: [uploadError]
                        });
                    }
                } else {
                    res.redirect(determineRedirectUrl());
                }
            }
        } catch (storageError) {
            next(storageError);
        }
    }

    router
        .route('/:section/:step?')
        .get(async function(req, res, next) {
            try {
                await renderStep({
                    req: req,
                    res: res,
                    sectionSlug: req.params.section,
                    stepNumber: req.params.step,
                    currentApplicationData: res.locals.currentApplicationData
                });
            } catch (err) {
                next(err);
            }
        })
        .post(handleSubmission);

    return router;
};
