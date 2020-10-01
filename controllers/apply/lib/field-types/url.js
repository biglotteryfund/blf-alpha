'use strict';

const Field = require('./field');

class UrlField extends Field {
    getType() {
        return 'url';
    }

    defaultMessages() {
        return [
            {
                type: 'string.max',
                message: this.localise({
                    en: `Organisation website must be 200 characters or less`,
                    cy: ``,
                }),
            },
        ];
    }

    get displayValue() {
        if (this.value) {
            return `http://${this.value.toLocaleString()}`;
        } else {
            return '';
        }
    }
}

module.exports = UrlField;
