const { Survey, SurveyChoice, SurveyResponse } = require('../models');

function findAll() {
    return Survey.findAll({
        include: [
            {
                model: SurveyChoice,
                as: 'choices',
                required: true,
                include: [
                    {
                        model: SurveyResponse,
                        as: 'responses',
                        required: true
                    }
                ]
            }
        ]
    });
}

function findActiveWithChoices({ filterByPath }) {
    return Survey.findAll({
        where: {
            active: true
        },
        include: [
            {
                model: SurveyChoice,
                as: 'choices',
                required: true
            }
        ]
    }).then(surveys => {
        if (filterByPath) {
            return surveys.filter(s => s.activePath === filterByPath);
        } else {
            return surveys;
        }
    });
}

function createWithChoices(data) {
    return Survey.create(data, {
        include: [
            {
                model: SurveyChoice,
                as: 'choices'
            }
        ]
    });
}

function createResponse(response) {
    return SurveyResponse.create(response);
}

module.exports = {
    findAll,
    findActiveWithChoices,
    createWithChoices,
    createResponse
};
