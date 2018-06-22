'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('application', {
        reference_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        application_data: {
            type: DataTypes.JSON
        }
    });
};
