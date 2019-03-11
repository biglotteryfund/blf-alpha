'use strict';

module.exports = function(sequelize, DataTypes) {
    return sequelize.define(
        'application',
        {
            id: {
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false
            },
            user_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: 'users',
                    key: 'id'
                }
            },
            form_id: {
                type: DataTypes.STRING,
                allowNull: false
            },
            application_title: {
                type: DataTypes.STRING,
                allowNull: false
            },
            application_data: {
                type: DataTypes.JSON,
                allowNull: false
            },
            status: {
                type: DataTypes.ENUM,
                values: ['ineligible', 'pending', 'complete'],
                allowNull: true
            }
        },
        {
            freezeTableName: true
        }
    );
};
