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
            {
                type: 'string.domain',
                message: this.localise({
                    en: `Organisation website must be in a valid URL format`,
                    cy: ``,
                }),
            },
        ];
    }

    defaultSchema() {
        const baseSchema = Joi.string().domain();

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.optional();
        }
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
