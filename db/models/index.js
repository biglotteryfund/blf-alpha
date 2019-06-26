'use strict';
const Sequelize = require('sequelize');
const debug = require('debug')('tnlcf:models');
const appData = require('../../common/appData');

const env = process.env.NODE_ENV || 'development';
const databaseConfig = require('../database-config')[env];

const Users = require('./user');
const Staff = require('./staff');
const Feedback = require('./feedback');
const SurveyAnswer = require('./survey');
const { PendingApplication, SubmittedApplication } = require('./applications');
const { Order, OrderItem } = require('./orders');

debug(`Using ${databaseConfig.dialect} database`);

const sequelize = new Sequelize(databaseConfig.url, databaseConfig);

sequelize
    .authenticate()
    .then(() => {
        debug('Connection has been established successfully.');
    })
    .catch(err => {
        debug('Unable to connect to the database:', err);
    });

/**
 * Register models and associations
 */
const db = {
    Users: Users.init(sequelize, Sequelize),
    Staff: Staff.init(sequelize, Sequelize),
    Feedback: Feedback.init(sequelize, Sequelize),
    SurveyAnswer: SurveyAnswer.init(sequelize, Sequelize),
    Order: Order.init(sequelize, Sequelize),
    OrderItem: OrderItem.init(sequelize, Sequelize)
};

if (appData.isNotProduction) {
    db.PendingApplication = PendingApplication.init(sequelize, Sequelize);
    db.SubmittedApplication = SubmittedApplication.init(sequelize, Sequelize);
}

Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
