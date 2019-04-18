'use strict';
const { sumBy } = require('lodash');
const moment = require('moment');

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
            application_data: {
                type: DataTypes.JSON,
                allowNull: true
            },
            status: {
                type: DataTypes.ENUM,
                values: ['pending', 'complete'],
                allowNull: false
            }
        },
        {
            getterMethods: {
                grantAmount() {
                    if (this.application_data && this.application_data['project-budget']) {
                        return sumBy(this.application_data['project-budget'], item => parseInt(item.cost || 0));
                    }
                    return false;
                },
                expiryDate() {
                    // @TODO should this be configurable somewhere?
                    return moment(this.createdAt)
                        .add(3, 'months')
                        .toDate();
                }
            }
        }
    );
};
