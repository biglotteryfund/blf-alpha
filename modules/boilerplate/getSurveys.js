'use strict';
const _ = require('lodash');
const config = require('config');

const app = require('../../server');
const models = require('../../models/index');

const currentSurveys = {};
models.Survey.findAll({
    where: {
        active: true
    },
    include: [
        {
            model: models.SurveyQuestion,
            required: true
        },
        {
            model: models.SurveyChoice,
            required: true
        }
    ]
}).then(surveys => {
    surveys.forEach(survey => {
        _.set(currentSurveys, survey.activePath, survey);
    });
    console.log(currentSurveys);
});