// @ts-nocheck
'use strict';
const moment = require('moment');
const { Model, Op } = require('sequelize');

class SurveyAnswer extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
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
        };

        return super.init(schema, {
            modelName: 'survey',
            freezeTableName: true,
            sequelize
        });
    }
    static createResponse({ choice, path, message }) {
        const expiryDate = moment()
            .subtract(3, 'months')
            .toDate();

        /**
         * Clean up old responses before submission
         */
        return Promise.all([
            this.destroy({
                where: { createdAt: { [Op.lte]: expiryDate } }
            }),
            this.create({
                choice: choice,
                path: path,
                message: message
            })
        ]);
    }
    static findAllByPath(urlPath) {
        const query = { order: [['updatedAt', 'DESC']] };
        if (urlPath) {
            query.where = { path: { [Op.eq]: urlPath } };
        }

        return this.findAll(query);
    }
}

module.exports = SurveyAnswer;
