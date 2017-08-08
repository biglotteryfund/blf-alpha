'use strict';
const _ = require('lodash');
const models = require('../../models/index');

// @TODO fetching new surveys requires an app restart... do we care?
const currentSurveys = {};
models.Survey.findAll({
    where: {
        active: true
    },
    include: [
        {
            model: models.SurveyChoice,
            as: 'choices',
            required: true
        }
    ]
}).then(surveys => {
    surveys.forEach(survey => {
        _.set(currentSurveys, survey.activePath, survey);
    });
});

module.exports = {
    get: () => {
        return currentSurveys;
    }
};