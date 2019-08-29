// @ts-nocheck
'use strict';
const moment = require('moment');
const { Model, Op, Sequelize } = require('sequelize');

class PendingApplication extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            id: {
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false
            },

            /**
             * User model reference
             */
            userId: {
                type: DataTypes.INTEGER,
                references: { model: 'users', key: 'id' }
            },

            /**
             * Form model ID
             * e.g. awards-for-all
             */
            formId: {
                type: DataTypes.STRING,
                allowNull: false
            },

            /**
             * Temporary JSON snapshot of form data
             * Raw output from joi schema
             */
            applicationData: {
                type: DataTypes.JSON,
                allowNull: true
            },

            /**
             * Track submission attempts
             * If there is an error in submission this will be incremented,
             * allowing us to report on failed submission attempts.
             */
            submissionAttempts: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                allowNull: false
            },

            /**
             * Expiry date for pending application
             * A scheduled job runs which cleans out expired applications
             */
            expiresAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        };

        return super.init(schema, {
            modelName: 'pendingapplication',
            sequelize
        });
    }
    static findAllByForm(formId, dateRange = {}) {
        let whereClause = {
            formId: { [Op.eq]: formId }
        };
        if (dateRange.start && dateRange.end) {
            whereClause = {
                createdAt: { [Op.between]: [dateRange.start, dateRange.end] }
            };
        }
        return this.findAll({
            where: whereClause,
            order: [['createdAt', 'ASC']]
        });
    }
    static findUserApplicationsByForm({ userId, formId }) {
        return this.findAll({
            where: {
                userId: { [Op.eq]: userId },
                formId: { [Op.eq]: formId }
            },
            order: [['createdAt', 'DESC']]
        });
    }
    static findApplicationsByExpiry(from, to) {
        let rawSqlStmt = `DATEDIFF(expiresAt, CURDATE()) >= ${from} AND DATEDIFF(expiresAt, CURDATE()) <= ${to}`;
        // const startDate = moment().toDate();
        // const endDate = moment().add('30', 'days').toDate();

        if (from === 'expired') {
            rawSqlStmt = 'DATEDIFF(expiresAt, CURDATE()) <= 0';
        }

        return this.findAll({
            where: Sequelize.literal(rawSqlStmt)
        });
    }
    static findApplicationForForm({ formId, applicationId, userId }) {
        return this.findOne({
            where: {
                id: { [Op.eq]: applicationId },
                formId: { [Op.eq]: formId },
                userId: { [Op.eq]: userId }
            }
        });
    }
    static createNewApplication({ userId, formId }) {
        // @TODO: Should this be defined in config?
        const expiresAt = moment()
            .add('3', 'months')
            .toDate();

        return this.create({
            userId: userId,
            formId: formId,
            applicationData: null,
            expiresAt: expiresAt
        });
    }
    static saveApplicationState(id, data) {
        return this.update(
            { applicationData: data },
            { where: { id: { [Op.eq]: id } } }
        );
    }
    static deleteApplication(id, userId) {
        return this.destroy({
            where: {
                userId: { [Op.eq]: userId },
                id: { [Op.eq]: id }
            }
        });
    }
}

class SubmittedApplication extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            id: {
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false
            },

            /**
             * User model reference
             */
            userId: {
                type: DataTypes.INTEGER,
                references: { model: 'users', key: 'id' }
            },

            /**
             * Form model ID
             * e.g. awards-for-all
             */
            formId: {
                type: DataTypes.STRING,
                allowNull: false
            },

            /**
             * Application title
             */
            applicationTitle: {
                type: DataTypes.STRING,
                allowNull: false
            },

            /**
             * Application country
             */
            applicationCountry: {
                type: DataTypes.STRING,
                allowNull: false
            },

            /**
             * Overview
             * key/value array used for overview in previews
             */
            applicationOverview: {
                type: DataTypes.JSON,
                allowNull: false
            },

            /**
             * Snapshot of questions and answers,
             * used to render a preview of submission
             */
            applicationSummary: {
                type: DataTypes.JSON,
                allowNull: false
            },

            /**
             * Salesforce reference ID from FormData record
             */
            salesforceId: {
                type: DataTypes.STRING,
                allowNull: true
            },

            /**
             * Snapshot of the JSON data sent to Salesforce
             * i.e. output of forSalesforce function
             */
            salesforceSubmission: {
                type: DataTypes.JSON,
                allowNull: false
            },

            /**
             * Started at date
             * Equivalent of createdAt date from PendingApplication
             * Allows us to report how long an application took
             */
            startedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        };

        return super.init(schema, {
            sequelize
        });
    }
    static findAllByForm(formId, dateRange = {}) {
        let whereClause = {
            formId: { [Op.eq]: formId }
        };
        if (dateRange.start && dateRange.end) {
            whereClause = {
                createdAt: { [Op.between]: [dateRange.start, dateRange.end] }
            };
        }
        return this.findAll({
            where: whereClause,
            order: [['createdAt', 'ASC']]
        });
    }
    static findUserApplicationsByForm({ userId, formId }) {
        return this.findAll({
            where: {
                userId: { [Op.eq]: userId },
                formId: { [Op.eq]: formId }
            },
            order: [['createdAt', 'DESC']]
        });
    }
    static createFromPendingApplication({
        pendingApplication,
        form,
        userId,
        formId,
        salesforceRecord = {}
    }) {
        return this.create({
            id: pendingApplication.id,
            userId: userId,
            formId: formId,
            applicationTitle: form.summary.title,
            applicationCountry: form.summary.country,
            applicationOverview: form.summary.overview,
            applicationSummary: form.fullSummary(),
            salesforceId: salesforceRecord.id,
            salesforceSubmission: salesforceRecord.submission,
            startedAt: pendingApplication.createdAt
        });
    }
}

class ApplicationExpirations extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            id: {
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false
            },

            /**
             * User model reference
             */
            applicationId: {
                type: DataTypes.INTEGER,
                references: { model: 'PendingApplications', key: 'id' }
            },

            /**
             * Type of reminders sent
             * e.g. ONE_MONTH_REMINDER
             */
            expirationType: {
                type: DataTypes.STRING,
                allowNull: false,
                get: function() {
                    return JSON.parse(this.getDataValue('expirationType'));
                }, 
                set: function(val) {
                    return this.setDataValue('expirationType', JSON.stringify(val));
                }
            }
        };

        return super.init(schema, {
            sequelize
        });
    }

    static createBulkExpiryApplications(dataArray) {
        return this.bulkCreate(dataArray)
    }
}

module.exports = { PendingApplication, SubmittedApplication, ApplicationExpirations };
