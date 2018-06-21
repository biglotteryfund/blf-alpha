'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('application', {
        application_data: {
            type: DataTypes.JSON
        }
    });
};
