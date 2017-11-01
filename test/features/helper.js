'use strict';
const config = require('config');
const importFresh = require('import-fresh');

// use the test database
process.env.CUSTOM_DB = config.get('database-test');
// run on another port from the default dev one
process.env.PORT = 8090;
// configure Sequelize to use a local, temporary sqlite db for testing
process.env.USE_LOCAL_DATABASE = true;
// never send emails in test mode (instead capture their content)
process.env.DONT_SEND_EMAIL = true;

const models = require('../../models/index');

let hook;

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
    before: callback => {
        hook = captureStream(process.stdout);
        const server = importFresh('../../bin/www');
        server.on('listening', () => {
            callback(server);
        });
    },
    after: server => {
        server.close();
        hook.unhook();
    },
    createTestUser: createTestUser,
    truncateUsers: truncateUsers
};
