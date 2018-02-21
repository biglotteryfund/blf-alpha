'use strict';
const debug = require('debug')('blf-alpha:models');
const Sequelize = require('sequelize');

const path = require('path');
const { DB_NAME, DB_HOST, DB_USER, DB_PASS } = require('../modules/secrets');

let db = {};

let sequelize;

if (DB_HOST) {
    const sequelizeConfig = {
        host: DB_HOST,
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

    sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, sequelizeConfig);

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
    db.Order = sequelize.import('../models/materials/order.js');
    db.OrderItem = sequelize.import('../models/materials/orderItem.js');

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
