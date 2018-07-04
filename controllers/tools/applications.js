'use strict';
const XLSX = require('xlsx');
const config = require('config');

const applicationService = require('../../services/applications');
const { purifyUserInput } = require('../../modules/validators');
const { getFullUrl } = require('../../modules/urls');
const appData = require('../../modules/appData');
const { getSecret } = require('../../modules/secrets');

const TEST_DOMAIN = process.env.TEST_DOMAIN || getSecret('test.domain');

const restrictAccess = (req, res, next) => {
    // these endpoints should only be available either in DEV,
    // or on Cloudfront-hosted environments (eg. TEST/LIVE domains)
    // which have WAF-protected status (eg. IP whitelisting)
    const cloudfrontDomains = [config.get('siteDomain'), TEST_DOMAIN];
    const isCloudfront = cloudfrontDomains.indexOf(req.get('host')) !== -1;
    const shouldServe = appData.isDev || isCloudfront;

    if (!shouldServe) {
        return res.redirect('/error-unauthorised');
    } else {
        return next();
    }
};

function init({ router }) {
    router.route('/applications/:formId?/:applicationId?').get(restrictAccess, async (req, res, next) => {
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

                if (req.query.download) {
                    // build a link to the application page
                    let urlBase = getFullUrl(req);
                    urlBase = urlBase.split('?')[0]; // remove querystring

                    let cells = applications.map(app => {
                        let data = app;
                        return {
                            form: data.form_id,
                            reference_id: data.reference_id,
                            link: `${urlBase}/${data.reference_id}`
                        };
                    });

                    // turn the applications into a spreadsheet
                    let worksheet = XLSX.utils.json_to_sheet(cells);
                    let workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'SheetJS');
                    const buffer = XLSX.write(workbook, {
                        type: 'buffer',
                        bookType: 'xlsx'
                    });
                    // send the file
                    res.setHeader('Content-Disposition', `attachment; filename=${formId}.xlsx`);
                    return res.status(200).send(buffer);
                }
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
