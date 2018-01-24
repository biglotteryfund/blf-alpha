'use strict';
const debug = require('debug')('blf-alpha:models');
const Sequelize = require('sequelize');
const config = require('config');
const path = require('path');
const getSecret = require('../modules/get-secret');

let db = {};

let dbCredentials = {
    host: process.env.mysqlHost || getSecret('mysql.host'),
    user: process.env.mysqlUser || getSecret('mysql.user'),
    pass: process.env.mysqlPassword || getSecret('mysql.password')
};

let sequelize;

if (dbCredentials.host) {
    let databaseName = process.env.CUSTOM_DB ? process.env.CUSTOM_DB : config.get('database');

    let sequelizeConfig = {
        host: dbCredentials.host,
        logging: false,
        dialect: 'mysql',
        // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators-security
        operatorsAliases: false,
        pool: {
            max: 5,
            min: 1,
            idle: 10000
        }
    };

    // allow using a local sqlite db for testing
    if (process.env.USE_LOCAL_DATABASE) {
        sequelizeConfig.dialect = 'sqlite';
        sequelizeConfig.storage = path.join(__dirname, `../tmp/test.db`);
    }

    sequelize = new Sequelize(databaseName, dbCredentials.user, dbCredentials.pass, sequelizeConfig);

    sequelize
        .authenticate()
        .then(() => {
            debug('Connection has been established successfully.');
        })
        .catch(err => {
            debug('Unable to connect to the database:', err);
        });

    // add models
    db.Users = sequelize.import('../models/user.js');
    db.Survey = sequelize.import('../models/surveys/survey.js');
    db.SurveyChoice = sequelize.import('../models/surveys/choice.js');
    db.SurveyResponse = sequelize.import('../models/surveys/response.js');

    if (config.get('storeOrderData')) {
        db.Order = sequelize.import('../models/materials/order.js');
        db.OrderItem = sequelize.import('../models/materials/orderItem.js');
    }

    // add model associations (eg. for joins etc)
    Object.keys(db).forEach(modelName => {
        if ('associate' in db[modelName]) {
            db[modelName].associate(db);
        }
    });

    // allow access to DB instance and sequelize API
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
}

module.exports = db;
