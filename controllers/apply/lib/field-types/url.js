'use strict';
const Joi = require('../joi-extensions');
const Field = require('./field');

class UrlField extends Field {
    constructor(props) {
        super(props);
    }

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

    defaultSchema() {
        const baseSchema = Joi.string();

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.allow('').optional();
        }
    }

    get displayValue() {
        if (this.value) {
            return `${this.value.toLocaleString()}`;
        } else {
            return '';
        }
    }
}

module.exports = UrlField;
