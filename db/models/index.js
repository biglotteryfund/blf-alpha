'use strict';
const Sequelize = require('sequelize');
const debug = require('debug')('tnlcf:models');
const appData = require('../../common/appData');

const env = process.env.NODE_ENV || 'development';
const databaseConfig = require('../database-config')[env];

const User = require('./user');
const Staff = require('./staff');
const Feedback = require('./feedback');
const SurveyAnswer = require('./survey');

debug(`Using ${databaseConfig.dialect} database`);

const sequelize = new Sequelize(databaseConfig.url, databaseConfig);

// @TODO: Should we remove this or move to bin/www, it's currently just a log message?
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
    Users: User.init(sequelize, Sequelize),
    Staff: Staff.init(sequelize, Sequelize),
    Feedback: Feedback.init(sequelize, Sequelize),
    SurveyAnswer: SurveyAnswer.init(sequelize, Sequelize),
    Order: sequelize.import('./order'),
    OrderItem: sequelize.import('./order-item')
};

if (appData.isNotProduction) {
    db.Application = sequelize.import('./application');
}

Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
