'use strict';
const path = require('path');
const express = require('express');
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');

const featuredErrors = require('./lib/featured-errors');

module.exports = function(formBuilder) {
    const router = express.Router();

    router.get('/', function(req, res) {
        const { copy, currentApplicationData } = res.locals;

        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: currentApplicationData
        });

        function errorsByStep() {
            if (form.validation.messages.length > 0) {
                return form.getCurrentSteps().map(function(step) {
                    const stepFields = flatMap(step.fieldsets, 'fields');
                    const fieldNames = stepFields.map(field => field.name);
                    return {
                        title: step.title,
                        errors: form.validation.messages.filter(err =>
                            fieldNames.includes(err.param)
                        )
                    };
                });
            } else {
                return [];
            }
        }

        const title = copy.summary.title;
        const showErrors = !!req.query['show-errors'] === true;

        const viewData = {
            form: form,
            csrfToken: req.csrfToken(),
            title: title,
            breadcrumbs: res.locals.breadcrumbs.concat({ label: title }),
            currentProjectName: get('projectName')(currentApplicationData),
            errors: form.validation.messages,
            errorsByStep: errorsByStep(),
            featuredErrors: featuredErrors(form.validation.messages, [
                {
                    param: 'projectDateRange',
                    includeBaseError: false
                },
                {
                    param: 'seniorContactRole',
                    includeBaseError: false
                }
            ]),
            showErrors: showErrors,
            expandSections: form.progress.isComplete || showErrors
        };

        res.render(path.resolve(__dirname, './views/summary'), viewData);
    });

    return router;
};
