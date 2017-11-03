'use strict';

module.exports = function (sequelize, DataTypes) {
    let SurveyChoice = sequelize.define('survey_choice', {
        title_en: {
            type: DataTypes.STRING
        },
        title_cy: {
            type: DataTypes.STRING
        },
        allow_message: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    });

    SurveyChoice.associate = (models) => {
        SurveyChoice.hasMany(models.SurveyResponse, {
            as: 'responses'
        });
    };

    return SurveyChoice;

};