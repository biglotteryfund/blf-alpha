'use strict';
const find = require('lodash/fp/find');
const Joi = require('../joi-extensions');

const Field = require('./field');

class RadioField extends Field {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'radio';

        const options = props.options || [];
        if (options.length === 0) {
            throw Error('Must provide options');
        }

        this.options = options;

        const baseSchema = Joi.string().valid(
            options.map(option => option.value)
        );

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? baseSchema.required()
                : baseSchema.optional();
        }
    }

    get displayValue() {
        const match = find(option => option.value === this.value)(this.options);
        return match ? match.label : '';
    }
}

module.exports = RadioField;
