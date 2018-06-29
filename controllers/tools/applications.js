'use strict';
const applicationService = require('../../services/applications');
const { purifyUserInput } = require('../../modules/validators');

function init({ router }) {
    router.route('/applications/:formId/:applicationId?').get(async (req, res, next) => {
        try {
            const formId = purifyUserInput(req.params.formId);

            const applications = await applicationService.getApplicationsByForm(formId);
            if (!applications) {
                return next();
            }
            // via https://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript#comment85199999_46959528
            const titleCase = (str) => str.replace(/\b\S/g, t => t.toUpperCase());
            let formTitle = titleCase(applications[0].form_id.replace(/-/g, ' '));

            let applicationData;
            if (req.params.applicationId) {
                applicationData = await applicationService.getApplicationsById(purifyUserInput(req.params.applicationId));
                if (!applicationData) {
                    return next();
                }
            }

            res.render('tools/applications', {
                formTitle,
                applications,
                formId,
                applicationData
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





