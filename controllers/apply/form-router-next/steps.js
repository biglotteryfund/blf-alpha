'use strict';
const path = require('path');
const express = require('express');
const concat = require('lodash/concat');
const findIndex = require('lodash/findIndex');
const flatMap = require('lodash/flatMap');
const get = require('lodash/get');
const keyBy = require('lodash/keyBy');
const mapValues = require('lodash/mapValues');
const Sentry = require('@sentry/node');

const { PendingApplication } = require('../../../db/models');

const pagination = require('./lib/pagination');
const validateForm = require('./lib/validate-form');
const s3 = require('./lib/s3');

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
                        const { nextUrl, previousUrl } = pagination({
                            baseUrl: res.locals.formBaseUrl,
                            sections: form.sections,
                            currentSectionIndex: sectionIndex,
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
                                previousUrl: previousUrl,
                                nextUrl: nextUrl,
                                errors: errors
                            };

                            res.render(
                                path.resolve(__dirname, './views/step'),
                                viewData
                            );
                        } else {
                            res.redirect(nextUrl);
                        }
                    } else {
                        res.redirect(res.locals.formBaseUrl);
                    }
                } else if (section.introduction) {
                    const { nextUrl, previousUrl } = pagination({
                        baseUrl: res.locals.formBaseUrl,
                        sections: form.sections,
                        currentSectionIndex: sectionIndex
                    });

                    const viewData = {
                        section: section,
                        breadcrumbs: concat(res.locals.breadcrumbs, {
                            label: sectionShortTitle,
                            url: sectionUrl
                        }),
                        nextUrl: nextUrl,
                        previousUrl: previousUrl
                    };

                    res.render(
                        path.resolve(__dirname, './views/section-introduction'),
                        viewData
                    );
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

            // @TODO: Lift up as form.getCurrentFields()
            const sectionIndex = findIndex(
                form.sections,
                section => section.slug === req.params.section
            );
            const currentSection = form.sections[sectionIndex];

            const stepIndex = parseInt(req.params.step, 10) - 1;
            const step = currentSection.steps[stepIndex];
            const stepFields = flatMap(step.fieldsets, 'fields');

            /**
             * Determine files to upload
             * - Retrieve the file from Formidable's parsed data
             * - Guard against empty files (eg. ignore empty file inputs when one already exists)
             */
            function determineFilesToUpload(fields, files) {
                const validFileFields = fields
                    .filter(field => field.type === 'file')
                    .filter(field => get(files, field.name).size > 0);

                return validFileFields.map(field => {
                    return {
                        fieldName: field.name,
                        fileData: get(files, field.name)
                    };
                });
            }

            const filesToUpload = determineFilesToUpload(stepFields, req.files);

            /**
             * Normalise file data for storage in validation object
             * This is the metadata submitted as part of JSON data
             * which joi validations run against.
             */
            function fileValues() {
                const keyedByFieldName = keyBy(filesToUpload, 'fieldName');

                return mapValues(keyedByFieldName, function({ fileData }) {
                    return {
                        filename: fileData.name,
                        size: fileData.size,
                        type: fileData.type
                    };
                });
            }

            /**
             * Validate form against combined application data
             * currentApplication data with req.body
             * and file metadata mixed in.
             */
            const combinedApplicationData = {
                ...applicationData,
                ...fileValues()
            };

            const validationResult = validateForm(
                form,
                combinedApplicationData
            );

            const errorsForStep = validationResult.messages.filter(item =>
                stepFields.map(f => f.name).includes(item.param)
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
                try {
                    const uploadPromises = filesToUpload.map(file =>
                        s3.uploadFile({
                            formId: formId,
                            applicationId: currentlyEditingId,
                            fileMetadata: file
                        })
                    );
                    await Promise.all(uploadPromises);
                } catch (rejection) {
                    Sentry.captureException(rejection.error);

                    const uploadError = {
                        msg: copy.common.errorUploading,
                        param: rejection.fieldName
                    };

                    const renderStep = renderStepFor(
                        req.params.section,
                        req.params.step
                    );

                    return renderStep(req, res, validationResult.value, [
                        uploadError
                    ]);
                }

                try {
                    /**
                     * Store the form's current state (errors and all) in the database
                     */
                    await PendingApplication.saveApplicationState(
                        currentlyEditingId,
                        validationResult.value
                    );

                    const { nextUrl } = pagination({
                        baseUrl: res.locals.formBaseUrl,
                        sections: form.sections,
                        currentSectionIndex: sectionIndex,
                        currentStepIndex: stepIndex
                    });
                    res.redirect(nextUrl);
                } catch (storageError) {
                    next(storageError);
                }
            }
        });

    return router;
};
