'use strict';

// use the test database
const config = require("config");
process.env.CUSTOM_DB = config.get('database-test');
process.env.PORT = 8090;


let server, hook;

let captureStream = (stream) => {
    let oldWrite = stream.write;
    let buf = '';
    stream.write = function (chunk, encoding, callback) {
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

module.exports = {
    before: () => {
        server = require('../bin/www');
        hook = captureStream(process.stdout);
        return server;
    },
    after: () => {
        server.close();
        hook.unhook();
    }
};