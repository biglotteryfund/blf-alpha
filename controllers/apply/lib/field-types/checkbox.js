'use strict';
const castArray = require('lodash/castArray');
const uniq = require('lodash/uniq');
const Joi = require('../joi-extensions');

const Field = require('./field');

class CheckboxField extends Field {
    constructor(props) {
        super(props);

        this.type = 'checkbox';

        const options = props.options || [];
        if (options.length === 0) {
            throw new Error('Must provide options');
        }

        const values = options.map(option => option.value);
        if (values.length !== uniq(values).length) {
            throw new Error('Options must contain unique values');
        }

        this.options = options;

        this.schema = props.schema ? props.schema : this.defaultSchema();
    }

    defaultSchema() {
        const options = this.options || [];
        const baseSchema = Joi.array()
            .items(Joi.string().valid(options.map(option => option.value)))
            .single();

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.optional();
        }
    }

    get displayValue() {
        if (this.value) {
            const choices = castArray(this.value);

            const matches = this.options.filter(option =>
                choices.includes(option.value)
            );

            return matches.length > 0
                ? matches.map(match => match.label).join(',\n')
                : choices.join(',\n');
        } else {
            return '';
        }
    }
}

module.exports = CheckboxField;
