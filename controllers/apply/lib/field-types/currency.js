'use strict';
const Joi = require('../joi-extensions');

const Field = require('./field');

class CurrencyField extends Field {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'currency';

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.friendlyNumber()
                      .integer()
                      .required()
                : Joi.friendlyNumber()
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
