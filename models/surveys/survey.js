'use strict';

module.exports = function (sequelize, DataTypes) {
    let Survey = sequelize.define('survey', {
        name: {
            type: DataTypes.STRING
        },
        question_en: {
            type: DataTypes.STRING
        },
        question_cy: {
            type: DataTypes.STRING
        },
        activePath: {
            type: DataTypes.STRING
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    });

    Survey.associate = (models) => {
        Survey.hasMany(models.SurveyChoice, {
            as: 'choices',
            onDelete: 'cascade',
            hooks: true
        });
    };

    return Survey;

};