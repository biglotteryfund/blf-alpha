'use strict';
const Joi = require('../joi-extensions');

const Field = require('./field');

class CurrencyField extends Field {
    getType() {
        return 'currency';
    }

    defaultSchema() {
        if (this.isRequired) {
            return Joi.friendlyNumber()
                .integer()
                .required();
        } else {
            return Joi.friendlyNumber()
                .integer()
                .optional();
        }
    }

    get displayValue() {
        if (this.value) {
            return `£${this.value.toLocaleString()}`;
        } else {
            return '';
        }
    }
}

module.exports = CurrencyField;
