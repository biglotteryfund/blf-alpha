'use strict';

module.exports = function (sequelize, DataTypes) {
    let SurveyResponse = sequelize.define('survey_response', {
        message: {
            type: DataTypes.TEXT
        },
        metadata: {
            type: DataTypes.TEXT
        }
    });

    SurveyResponse.associate = (models) => {
        SurveyResponse.hasMany(models.SurveyChoice, { as: 'responses' });
    };

    return SurveyResponse;

};