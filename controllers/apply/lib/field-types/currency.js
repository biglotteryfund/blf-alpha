'use strict';
const Joi = require('../joi-extensions');

const Field = require('./field');

class CurrencyField extends Field {
    constructor(props) {
        super(props);

        this.minAmount = props.minAmount;

        this.schema = props.schema ? props.schema : this.defaultSchema();
    }

    getType() {
        return 'currency';
    }

    defaultSchema() {
        const minAmount = this.minAmount || 0;
        const baseSchema = Joi.friendlyNumber()
            .integer()
            .min(minAmount);

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.optional();
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
