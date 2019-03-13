'use strict';
const { sumBy } = require('lodash');

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
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM,
                values: ['ineligible', 'eligible', 'pending', 'complete'],
                allowNull: true
            }
        },
        {
            freezeTableName: true,
            getterMethods: {
                grantAmount() {
                    if (this.application_data && this.application_data['project-budget']) {
                        return sumBy(this.application_data['project-budget'], item => parseInt(item.cost || 0));
                    }
                    return false;
                }
            }
        }
    );
};
