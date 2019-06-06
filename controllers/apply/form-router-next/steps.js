'use strict';
const path = require('path');
const express = require('express');
const concat = require('lodash/concat');
const get = require('lodash/get');
const findIndex = require('lodash/findIndex');
const partition = require('lodash/partition');
const flatMap = require('lodash/flatMap');
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
            const { currentlyEditingId, currentApplicationData } = res.locals;
            let data = { ...currentApplicationData, ...req.body };

            let form = formBuilder({
                locale: req.i18n.getLocale(),
                data: data
            });

            const sectionIndex = findIndex(
                form.sections,
                section => section.slug === req.params.section
            );
            const currentSection = form.sections[sectionIndex];

            const stepIndex = parseInt(req.params.step, 10) - 1;
            const step = currentSection.steps[stepIndex];
            const stepFields = flatMap(step.fieldsets, 'fields');

            // Check if this step expected any file inputs
            const fileFields = stepFields
                .filter(f => f.type === 'file')
                .map(f => f.name);

            // If we expected files, check whether they were sent
            const filesToUpload = fileFields
                .filter(fieldName => {
                    // Retrieve the file from Formidable's parsed data
                    const uploadedFile = get(req.files, fieldName);
                    // Ensure a file was actually provided
                    // (eg. ignore empty file inputs when a file already exists)
                    return uploadedFile && uploadedFile.size > 0;
                })
                .map(fieldName => {
                    // Log this file as a potential upload
                    const uploadedFile = get(req.files, fieldName);
                    return {
                        fieldName: fieldName,
                        fileData: uploadedFile
                    };
                });

            // Append the file data to the overall form data for validation
            filesToUpload.forEach(file => {
                data[file.fieldName] = {
                    filename: file.fileData.name,
                    size: file.fileData.size,
                    type: file.fileData.type
                };
            });

            let validationResult = validateForm(form, data);

            try {
                const fieldNamesForStep = flatMap(step.fieldsets, 'fields').map(
                    field => field.name
                );

                let errorsForStep = validationResult.messages.filter(item =>
                    fieldNamesForStep.includes(item.param)
                );

                const [invalidFiles, validFiles] = partition(
                    filesToUpload,
                    file => {
                        return errorsForStep.find(
                            _ => _.param === file.fieldName
                        );
                    }
                );

                invalidFiles.forEach(file => {
                    // Remove the (invalid) file information from form data
                    delete validationResult.value[file.fieldName];
                });

                // Check if any files were included and handle them (if valid)
                await Promise.all(
                    validFiles.map(file =>
                        s3.uploadFile({
                            formId: formId,
                            applicationId: currentlyEditingId,
                            fileMetadata: file
                        })
                    )
                ).catch(rejection => {
                    Sentry.captureException(rejection.error);
                    // Manually create a form error and send the user back to the form
                    errorsForStep = concat(errorsForStep, {
                        // @TODO i18n
                        msg: `There was an error uploading your file - please try again`,
                        param: rejection.fieldName
                    });
                });

                // Store the form's current state (errors and all) in the database
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
                    const { nextUrl } = pagination({
                        baseUrl: res.locals.formBaseUrl,
                        sections: form.sections,
                        currentSectionIndex: sectionIndex,
                        currentStepIndex: stepIndex
                    });
                    res.redirect(nextUrl);
                }
            } catch (error) {
                next(error);
            }
        });

    return router;
};
