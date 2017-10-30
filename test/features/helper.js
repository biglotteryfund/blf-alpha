'use strict';

// use the test database
const config = require('config');
const models = require('../../models/index');

process.env.CUSTOM_DB = config.get('database-test');

// run on another port from the default dev one
process.env.PORT = 8090;

// configure Sequelize to use a local, temporary sqlite db for testing
process.env.USE_LOCAL_DATABASE = true;

let server, hook;

let captureStream = stream => {
    let oldWrite = stream.write;
    let buf = '';
    stream.write = function(chunk) {
        buf += chunk.toString(); // chunk is a String or Buffer
        oldWrite.apply(stream, arguments);
    };

    return {
        unhook: () => {
            stream.write = oldWrite;
        },
        captured: () => {
            return buf;
        }
    };
};

const createTestUser = userData => {
    return models.Users.create(userData);
};

const truncateUsers = () => {
    return models.Users.destroy({ where: {} });
};

module.exports = {
    before: () => {
        server = require('../../bin/www');
        hook = captureStream(process.stdout);
        return server;
    },
    after: () => {
        server.close();
        hook.unhook();
    },
    createTestUser: createTestUser,
    truncateUsers: truncateUsers
};
