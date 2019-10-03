'use strict';
const find = require('lodash/fp/find');
const Joi = require('../joi-extensions');

const Field = require('./field');

class RadioField extends Field {
    constructor(props) {
        super(props);

        const options = props.options || [];
        if (options.length === 0) {
            throw Error('Must provide options');
        }

        this.options = options;

        this.schema = props.schema ? props.schema : this.defaultSchema();
    }

    getType() {
        return 'radio';
    }

    defaultSchema() {
        const options = this.options || [];
        const baseSchema = Joi.string().valid(
            options.map(option => option.value)
        );

        return this.isRequired ? baseSchema.required() : baseSchema.optional();
    }

    get displayValue() {
        const match = find(option => option.value === this.value)(this.options);
        return match ? match.label : '';
    }
}

module.exports = RadioField;
