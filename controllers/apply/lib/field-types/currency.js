'use strict';
const Joi = require('../joi-extensions');

const Field = require('./field');

class CurrencyField extends Field {
    constructor(props) {
        super(props);
        this.minAmount = props.minAmount;
        this.schema = this.withCustomSchema(props.schema);
    }

    getType() {
        return 'currency';
    }

    defaultSchema() {
        const minAmount = this.minAmount || 0;
        const maxAmount = this.maxAmount || 999999999;
        const baseSchema = Joi.friendlyNumber().integer()
            .min(minAmount)
            .max(maxAmount);

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return Joi.optional();
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
