'use strict';
const path = require('path');
const express = require('express');
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');

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

        res.render(path.resolve(__dirname, './views/summary'), {
            form: form,
            csrfToken: req.csrfToken(),
            title: title,
            breadcrumbs: res.locals.breadcrumbs.concat({ label: title }),
            currentProjectName: get('projectName')(currentApplicationData),
            showErrors: showErrors,
            errors: form.validation.messages,
            errorsByStep: errorsByStep(),
            featuredErrors: form.validation.featuredMessages,
            expandSections: form.progress.isComplete || showErrors
        });
    });

    return router;
};
