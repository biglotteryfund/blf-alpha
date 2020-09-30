'use strict';

const Field = require('./field');

class UrlField extends Field {
    getType() {
        return 'url';
    }
}

module.exports = UrlField;
