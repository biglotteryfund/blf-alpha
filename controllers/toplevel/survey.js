'use strict';
const { body, validationResult } = require('express-validator/check');
const { pick } = require('lodash');

const { purifyUserInput } = require('../../modules/validators');
const { sMaxAge } = require('../../middleware/cached');
const surveyService = require('../../services/surveys');

function init({ router }) {
    router
        .route('/survey')
        .get(sMaxAge('10m'), (req, res) => {
            // Expose lang config for client-side component
            res.send(req.i18n.__('global.survey'));
        })
        .post(
            [
                body('choice')
                    .exists()
                    .not()
                    .isEmpty()
                    .isIn(['yes', 'no'])
                    .withMessage('Please supply a valid choice'),
                body('path').exists()
            ],
            async (req, res) => {
                const errors = validationResult(req);

                if (errors.isEmpty()) {
                    for (let key in req.body) {
                        req.body[key] = purifyUserInput(req.body[key]);
                    }

                    try {
                        const responseData = pick(req.body, ['choice', 'path', 'message']);
                        const result = await surveyService.createResponse(responseData);
                        res.send({
                            status: 'success',
                            result: result
                        });
                    } catch (err) {
                        res.status(400).send({
                            status: 'error',
                            err: err
                        });
                    }
                } else {
                    res.status(400).send({
                        status: 'error',
                        err: errors.array()
                    });
                }
            }
        );
}

module.exports = {
    init
};
