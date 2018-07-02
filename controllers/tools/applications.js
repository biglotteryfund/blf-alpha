'use strict';
const applicationService = require('../../services/applications');
const { purifyUserInput } = require('../../modules/validators');

function init({ router }) {

    // domain must be www.biglotteryfund.org.uk or test.blf.digital (eg. CF-protected)
    // and then WAF rules can protect us
    router.route('/applications/:formId?/:applicationId?').get(async (req, res, next) => {
        try {
            let forms, applications, formTitle, applicationData;
            const formId = purifyUserInput(req.params.formId);

            if (!formId) {
                // fetch all forms instead for a list
                formTitle = 'All online forms';
                forms = await applicationService.getAvailableForms();
            } else {
                // get applications for a given form
                applications = await applicationService.getApplicationsByForm(formId);
                if (!applications) {
                    return next();
                }
                formTitle = applications[0].formTitle;
            }

            if (req.params.applicationId) {
                // look up a specific application
                applicationData = await applicationService.getApplicationsById(
                    purifyUserInput(req.params.applicationId)
                );
                if (!applicationData) {
                    return next();
                }
            }

            res.render('tools/applications', {
                formTitle,
                applications,
                formId,
                applicationData,
                forms
            });
        } catch (error) {
            next(error);
        }
    });

    return router;
}

module.exports = {
    init
};
