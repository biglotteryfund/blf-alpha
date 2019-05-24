'use strict';

/* Did you find what you were looking for? */
module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
        'survey',
        {
            choice: {
                type: DataTypes.ENUM('yes', 'no'),
                allowNull: false
            },
            path: {
                type: DataTypes.TEXT,
                allowNull: false
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
