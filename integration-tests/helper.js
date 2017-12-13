'use strict';
const config = require('config');
const importFresh = require('import-fresh');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// use the test database
process.env.CUSTOM_DB = config.get('database-test');
// run on another port from the default dev one
process.env.PORT = 8090;
// configure Sequelize to use a local, temporary sqlite db for testing
process.env.USE_LOCAL_DATABASE = true;
// never send emails in test mode (instead capture their content)
process.env.DONT_SEND_EMAIL = true;

const userService = require('../services/user');

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

const createTestUser = userData => userService.createUser(userData);

const truncateUsers = () => userService.__destroyAll();

function getCsrfToken(agent, urlPath) {
    return new Promise(resolve => {
        agent.get(urlPath).end((err, res) => {
            const dom = new JSDOM(res.text);
            const csrfToken = dom.window.document.querySelector('input[name=_csrf]').value;
            resolve(csrfToken);
        });
    });
}

module.exports = {
    before: callback => {
        hook = captureStream(process.stdout);
        const server = importFresh('../bin/www');
        server.on('listening', () => {
            callback(server);
        });
    },
    after: server => {
        server.close();
        hook.unhook();
    },
    createTestUser: createTestUser,
    truncateUsers: truncateUsers,
    getCsrfToken: getCsrfToken
};
