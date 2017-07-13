'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('news', {
        title: {
            type: DataTypes.STRING
        },
        text: {
            type: DataTypes.TEXT
        },
        link: {
            type: DataTypes.STRING
        },
        locale: {
            type: DataTypes.STRING
        },
    });

};