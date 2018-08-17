'use strict';
const formHelpers = require('./forms');

function init(app) {
    const setViewGlobal = (name, value) => {
        app.get('engineEnv').addGlobal(name, value);
    };

    setViewGlobal('formHelpers', formHelpers);
}

module.exports = {
    init
};
