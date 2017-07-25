'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('survey', {
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

};