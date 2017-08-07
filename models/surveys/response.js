'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('survey_response', {
        message: {
            type: DataTypes.TEXT
        },
        metadata: {
            type: DataTypes.TEXT
        }
    });
};