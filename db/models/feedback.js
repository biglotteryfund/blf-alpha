'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
        'feedback',
        {
            description: {
                type: DataTypes.STRING
            },
            message: {
                type: DataTypes.TEXT
            }
        },
        {
            freezeTableName: true
        }
    );
};
