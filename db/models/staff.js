'use strict';
const { Model, Op } = require('sequelize');

class Staff extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            oid: {
                type: DataTypes.STRING,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false
            },
            given_name: {
                type: DataTypes.STRING,
                allowNull: true
            },
            family_name: {
                type: DataTypes.STRING,
                allowNull: true
            }
        };

        return super.init(schema, {
            modelName: 'staff',
            freezeTableName: true,
            sequelize
        });
    }
    get fullName() {
        return `${this.given_name} ${this.family_name}`;
    }
}

module.exports = Staff;
