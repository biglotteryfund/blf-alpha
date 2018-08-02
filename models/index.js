'use strict';
const { startsWith } = require('lodash');
const Sequelize = require('sequelize');
const debug = require('debug')('blf-alpha:models');

const { DB_CONNECTION_URI } = require('../modules/secrets');

const useSqlite = process.env.NODE_ENV !== 'production' && startsWith(DB_CONNECTION_URI, 'sqlite://');
const dialect = useSqlite ? 'sqlite' : 'mysql';

debug(`Using ${dialect} database`);

const sequelize = new Sequelize(DB_CONNECTION_URI, {
    logging: false,
    dialect: dialect,
    define: {
        charset: 'utf8mb4',
        dialectOptions: {
            collate: 'utf8mb4_general_ci'
        }
    },
    operatorsAliases: false,
    pool: {
        max: 5,
        min: 1,
        idle: 10000
    }
});

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
const db = {};
db.Users = sequelize.import('../models/user.js');
db.Feedback = sequelize.import('./feedback');

db.SurveyAnswer = sequelize.import('./survey');

db.Order = sequelize.import('../models/materials/order.js');
db.OrderItem = sequelize.import('../models/materials/orderItem.js');

Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db);
    }
});

/**
 * Allow access to DB instance and sequelize API
 */
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
