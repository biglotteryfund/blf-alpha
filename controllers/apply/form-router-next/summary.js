'use strict';
const path = require('path');
const express = require('express');
const differenceBy = require('lodash/differenceBy');
const flatMap = require('lodash/flatMap');
const get = require('lodash/fp/get');
const concat = require('lodash/concat');

const logger = require('../../../common/logger').child({
    service: 'form-summary'
});

/**
 * Compare the raw list of messages with the messages based on current steps\
 * If this list is different then it suggests an error with the validation
 * logic so we should log a warning for investigation.
 *
 * @param rawValidationErrors
 * @param stepValidationErrors
 */
function logErrorDifference(rawValidationErrors, stepValidationErrors) {
    const errorDifference = differenceBy(
        rawValidationErrors,
        stepValidationErrors,
        item => item.param
    );

    if (errorDifference.length) {
        errorDifference.forEach(function(item) {
            logger.error(
                `${item.param} not included in step fields but failed validation`,
                { messages: item.msg }
            );
        });
    }
}

module.exports = function(formBuilder) {
    const router = express.Router();

    router.get('/', function(req, res) {
        const { copy, currentApplicationData } = res.locals;

        const form = formBuilder({
            locale: req.i18n.getLocale(),
            data: currentApplicationData
        });

        const errorsByStep = form.getErrorsByStep();

        logErrorDifference(
            form.validation.messages,
            flatMap(errorsByStep, step => step.errors)
        );

        const title = copy.summary.title;
        const showErrors = !!req.query['show-errors'] === true;

        if (showErrors) {
            res.locals.hotJarTagList = [
                'Apply: AFA: Summary: User clicked Submit early'
            ];
        }

        const featuredErrors = form.validation.featuredMessages;

        if (featuredErrors.length > 0) {
            const msg = ['Apply: AFA: Summary: User shown soft warnings'];
            if (res.locals.hotJarTagList) {
                res.locals.hotJarTagList = concat(
                    res.locals.hotJarTagList,
                    msg
                );
            } else {
                res.locals.hotJarTagList = msg;
            }
        }

        res.render(path.resolve(__dirname, './views/summary'), {
            form: form,
            csrfToken: req.csrfToken(),
            title: title,
            breadcrumbs: res.locals.breadcrumbs.concat({ label: title }),
            currentProjectName: get('projectName')(currentApplicationData),
            showErrors: showErrors,
            errors: form.validation.messages,
            errorsByStep: errorsByStep,
            featuredErrors: featuredErrors,
            expandSections: form.progress.isComplete || showErrors,
            startPathSlug: form.sections[0].slug
        });
    });

    return router;
};
