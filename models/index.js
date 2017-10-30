'use strict';
const Sequelize = require('sequelize');
const config = require('config');
const path = require('path');
const fs = require('fs');
const secrets = require('../modules/secrets');

let db = {};

// try getting credentials from env vars (eg. for travis)
let dbCredentials = {
    host: secrets['mysql.host'] || process.env.mysqlHost,
    user: secrets['mysql.user'] || process.env.mysqlUser,
    pass: secrets['mysql.password'] || process.env.mysqlPassword
};

let sequelize;

if (dbCredentials.host) {
    let databaseName = (process.env.CUSTOM_DB) ? process.env.CUSTOM_DB : config.get('database');

    let sequelizeConfig = {
        host: dbCredentials.host,
        logging: false,
        dialect: 'mysql',
        pool: {
            max: 5,
            min: 1,
            idle: 10000
        }
    };

    // allow using a local sqlite db for testing
    if (process.env.USE_LOCAL_DATABASE) {
        sequelizeConfig.dialect = 'sqlite';
        const localDbPath = path.join(__dirname, `../tmp/test.db`);
        // delete it first so previous test data doesn't persist
        fs.unlinkSync(localDbPath);
        sequelizeConfig.storage = localDbPath;
    }

    sequelize = new Sequelize(databaseName, dbCredentials.user, dbCredentials.pass, sequelizeConfig);

    sequelize.authenticate().then(() => {
        console.log('Connection has been established successfully.');
    }).catch(err => {
        console.error('Unable to connect to the database:', err);
        // process.exit(1);
    });

    // add models
    db.News = sequelize.import('../models/news.js');
    db.Users = sequelize.import('../models/user.js');

    // add model associations (eg. for joins etc)
    Object.keys(db).forEach((modelName) => {
        if ("associate" in db[modelName]) {
            db[modelName].associate(db);
        }
    });

    // allow access to DB instance and sequelize API
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
}

module.exports = db;
