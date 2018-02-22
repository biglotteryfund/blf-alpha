'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('survey_response', {
        survey_id: {
            type: DataTypes.INTEGER
        },
        choice_id: {
            type: DataTypes.INTEGER
        },
        message: {
            type: DataTypes.TEXT
        },
        metadata: {
            type: DataTypes.TEXT
        }
    });
};
