'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('application', {
        form_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        reference_id: {
            type: DataTypes.STRING,
            allowNull: false
        },
        application_data: {
            type: DataTypes.JSON
        }
    });
};
