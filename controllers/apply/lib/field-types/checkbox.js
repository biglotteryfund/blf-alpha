'use strict';
const castArray = require('lodash/castArray');
const uniq = require('lodash/uniq');
const Joi = require('../joi-extensions-next');

const Field = require('./field');

class CheckboxField extends Field {
    constructor(props) {
        super(props);

        this.type = 'checkbox';

        const options = props.options || [];
        if (options.length === 0) {
            throw new Error('Must provide options');
        }

        const values = options.map((option) => option.value);
        if (values.length !== uniq(values).length) {
            throw new Error('Options must contain unique values');
        }

        this.options = options;

        this.schema = this.withCustomSchema(props.schema);
    }

    defaultSchema() {
        const options = this.options || [];
        const baseSchema = Joi.array()
            .items(Joi.string().valid(options.map((option) => option.value)))
            .single();

        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.optional();
        }
    }

    get displayValue() {
        if (this.value) {
            return this.options
                .filter((option) =>
                    castArray(this.value).includes(option.value)
                )
                .map((match) => match.label)
                .join(',\n');
        } else {
            return '';
        }
    }
}

module.exports = CheckboxField;
