'use strict';
const { startsWith } = require('lodash');
const { DB_CONNECTION_URI } = require('../modules/secrets');

const commonConfig = {
    dialect: 'mysql',
    define: {
        charset: 'utf8mb4',
        dialectOptions: {
            collate: 'utf8mb4_general_ci'
        }
    },
    operatorsAliases: false,
    pool: { max: 5, min: 1, idle: 10000 }
};

module.exports = {
    development: Object.assign(commonConfig, {
        url: process.env.DB_CONNECTION_URI,
        dialect: startsWith(process.env.DB_CONNECTION_URI, 'sqlite://')
            ? 'sqlite'
            : 'mysql'
    }),
    test: Object.assign(commonConfig, {
        url: DB_CONNECTION_URI,
        logging: false
    }),
    production: Object.assign(commonConfig, {
        url: DB_CONNECTION_URI,
        logging: false
    })
};
