'use strict';
const Sequelize = require('sequelize');
const debug = require('debug')('tnlcf:models');
const appData = require('../../modules/appData');

const env = process.env.NODE_ENV || 'development';
const databaseConfig = require('../database-config')[env];

const SurveyAnswer = require('./survey');

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
    Users: sequelize.import('./user'),
    Staff: sequelize.import('./staff'),
    Feedback: sequelize.import('./feedback'),
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
