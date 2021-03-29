'use strict';
const startsWith = require('lodash/startsWith');
const { DB_CONNECTION_URI } = require('../common/secrets');

const commonConfig = {
    dialect: 'mysql',
    define: {
        charset: 'utf8mb4',
        dialectOptions: {
            collate: 'utf8mb4_general_ci',
        },
    },
    pool: { max: 5, min: 1, idle: 10000 },
    retry: {
        match: [
            'Deadlock found when trying to get lock; try restarting transaction',
        ],
        max: 3,
    },
};

module.exports = {
    development: Object.assign(commonConfig, {
        url: process.env.DB_CONNECTION_URI,
        dialect: startsWith(process.env.DB_CONNECTION_URI, 'sqlite://')
            ? 'sqlite'
            : 'mysql',
    }),
    dev: Object.assign(commonConfig, {
        url: DB_CONNECTION_URI,
        logging: false,
    }),
    test: Object.assign(commonConfig, {
        url: DB_CONNECTION_URI,
        logging: false,
    }),
    production: Object.assign(commonConfig, {
        url: DB_CONNECTION_URI,
        logging: false,
    }),
};
