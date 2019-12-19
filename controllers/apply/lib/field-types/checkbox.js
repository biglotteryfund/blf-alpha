'use strict';
const castArray = require('lodash/castArray');
const Joi = require('../joi-extensions');

const Field = require('./field');

class CheckboxField extends Field {
    constructor(props) {
        super(props);

        this.optgroups = props.optgroups || [];
        this.options = props.options || [];

        this.schema = props.schema ? props.schema : this.defaultSchema();
    }

    getType() {
        return 'checkbox';
    }

    _normalisedOptions() {
        const optgroups = this.optgroups || [];
        const options = this.options || [];
        return optgroups.length > 0
            ? optgroups.flatMap(group => group.options)
            : options;
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

            const matches = this._normalisedOptions().filter(option =>
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
