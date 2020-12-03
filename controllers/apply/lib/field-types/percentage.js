'use strict';
const Joi = require('../joi-extensions');

const Field = require('./field');

class PercentageField extends Field {
    constructor(props) {
        super(props);
        this.minAmount = props.minAmount;
        this.schema = this.withCustomSchema(props.schema);
    }

    getType() {
        return 'percentage';
    }

    defaultSchema() {
        const baseSchema = Joi.number().integer().min(0).max(100);

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.allow('').optional();
        }
    }

    get displayValue() {
        if (this.value) {
            return `${this.value.toLocaleString()}%`;
        } else {
            return '';
        }
    }
}

module.exports = PercentageField;
