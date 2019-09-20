'use strict';
const express = require('express');
const path = require('path');

module.exports = function(formId, formBuilder, eligibilityBuilder) {
    const router = express.Router();

    router.get('/', function(req, res) {
        const form = formBuilder({
            locale: req.i18n.getLocale(),
            showAllFields: true
        });

        const eligibility = eligibilityBuilder({
            locale: req.i18n.getLocale()
        });

        res.locals.enableSiteSurvey = true;

        return res.render(
            path.resolve(__dirname, './views/questions-html.njk'),
            {
                title: form.title,
                form: form,
                eligibility: eligibility
            }
        );
    });

    return router;
};
