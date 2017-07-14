'use strict';

module.exports = function (sequelize, DataTypes) {
    return sequelize.define('news', {
        title_en: {
            type: DataTypes.STRING
        },
        title_cy: {
            type: DataTypes.STRING
        },
        text_en: {
            type: DataTypes.TEXT
        },
        text_cy: {
            type: DataTypes.TEXT
        },
        link_en: {
            type: DataTypes.STRING
        },
        link_cy: {
            type: DataTypes.STRING
        }
    });

};