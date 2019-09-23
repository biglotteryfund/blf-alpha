// @ts-nocheck
'use strict';
const moment = require('moment');
const env = process.env.NODE_ENV || 'development';
const { Model, Op, Sequelize } = require('sequelize');
const { dialect } = require('../database-config')[env];

const {
    EXPIRY_EMAIL_REMINDERS
} = require('../../controllers/apply/awards-for-all/constants');

const Users = require('./user');

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
                type: DataTypes.INTEGER
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
             * Application's Current Progress Status
             * e.g. PENDING
             */
            currentProgressState: {
                type: DataTypes.ENUM('NOT_STARTED', 'PENDING', 'COMPLETE'),
                allowNull: true,
                defaultValue: 'NOT_STARTED'
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
            modelName: 'PendingApplication',
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
    static findExpired() {
        let rawSqlStmt;

        if (dialect === 'sqlite') {
            rawSqlStmt = `julianday(expiresAt) - julianday('now') <= 0`;
        } else {
            rawSqlStmt = 'DATEDIFF(expiresAt, CURDATE()) <= 0';
        }

        return this.findAll({
            attributes: ['id', 'userId'],
            where: Sequelize.literal(rawSqlStmt)
        });
    }
    static deleteApplications(applicationIds) {
        return this.destroy({
            where: {
                id: { [Op.in]: applicationIds }
            }
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
    static countCompleted(applications) {
        return applications.filter(
            app => app.currentProgressState === 'COMPLETE'
        ).length;
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
    static saveApplicationState(id, data, currentProgressState) {
        return this.update(
            {
                applicationData: data,
                currentProgressState
            },
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
                type: DataTypes.INTEGER
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

class EmailQueue extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            id: {
                primaryKey: true,
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false
            },

            /**
             * PendingApplication model reference
             */
            applicationId: {
                type: DataTypes.UUID
            },

            /**
             * Email type
             * e.g. AFA_ONE_MONTH, GET_ADVICE_ONE_WEEK etc
             */
            emailType: {
                type: DataTypes.STRING,
                allowNull: false
            },

            /**
             * Status of email
             * e.g. SENT, NOT_SENT etc
             */
            status: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'NOT_SENT'
            },

            /**
             * Date to send out the email
             */
            dateToSend: {
                type: DataTypes.DATE,
                allowNull: false
            }
        };

        return super.init(schema, {
            modelName: 'EmailQueue',
            freezeTableName: true,
            sequelize
        });
    }

    static createNewQueue(applicationId, expiresAt) {
        return this.bulkCreate([
            {
                applicationId,
                emailType: EXPIRY_EMAIL_REMINDERS.MONTH,
                dateToSend: moment(expiresAt).subtract('30', 'days')
            },
            {
                applicationId,
                emailType: EXPIRY_EMAIL_REMINDERS.WEEK,
                dateToSend: moment(expiresAt).subtract('14', 'days')
            },
            {
                applicationId,
                emailType: EXPIRY_EMAIL_REMINDERS.DAY,
                dateToSend: moment(expiresAt).subtract('2', 'days')
            }
        ]);
    }

    static getEmailsToSend() {
        return this.findAll({
            where: {
                status: { [Op.eq]: 'NOT_SENT' },
                [Op.and]: [
                    // @TODO make this support sqlite too
                    Sequelize.where(
                        Sequelize.fn(
                            'datediff',
                            Sequelize.col('dateToSend'),
                            Sequelize.fn('NOW')
                        ),
                        {
                            [Op.lte]: 0
                        }
                    )
                ]
            },
            include: [
                {
                    model: PendingApplication,
                    include: [
                        {
                            model: Users
                        }
                    ]
                }
            ]
        });
    }

    static updateStatusToSent(queueId) {
        return this.update(
            {
                status: 'SENT'
            },
            { where: { id: { [Op.eq]: queueId } } }
        );
    }

    static deleteEmailQueues(applicationIds) {
        return this.destroy({
            where: {
                applicationId: { [Op.in]: applicationIds }
            }
        });
    }
}

module.exports = { PendingApplication, SubmittedApplication, EmailQueue };
