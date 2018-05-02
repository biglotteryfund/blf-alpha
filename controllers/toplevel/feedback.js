'use strict';
const { body, validationResult } = require('express-validator/check');
const { matchedData } = require('express-validator/filter');
const { FORM_STATES } = require('../../modules/forms');
const feedbackService = require('../../services/feedback');

function init({ router }) {
    const validators = [
        body('description')
            .exists()
            .not()
            .isEmpty(),
        body('message')
            .exists()
            .not()
            .isEmpty()
    ];

    router.post('/feedback', validators, (req, res) => {
        const formErrors = validationResult(req);
        const formData = matchedData(req);
        const messageSuccess = req.i18n.__('global.surveys.response.success');
        const messageError = req.i18n.__('global.surveys.response.error');

        if (formErrors.isEmpty()) {
            feedbackService
                .storeFeedback({
                    description: formData['description'],
                    message: formData['message']
                })
                .then(() => {
                    res.json({
                        status: FORM_STATES.SUBMISSION_SUCCESS,
                        message: messageSuccess,
                        data: formData
                    });
                })
                .catch(err => {
                    res.status(400).json({
                        status: FORM_STATES.SUBMISSION_ERROR,
                        message: messageError,
                        err: err
                    });
                });
        } else {
            res.status(400).json({
                status: FORM_STATES.VALIDATION_ERROR,
                message: messageError,
                err: 'Please supply all fields'
            });
        }
    });
}

module.exports = {
    init
};
