'use strict';
const find = require('lodash/fp/find');
const flatMap = require('lodash/flatMap');
const Joi = require('../joi-extensions');

const Field = require('./field');

class SelectField extends Field {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'select';

        this.optgroups = props.optgroups || [];
        this.options = props.options || [];

        if (this.optgroups.length > 0) {
            if (props.defaultOption) {
                this.defaultOption = props.defaultOption;
            } else {
                throw new Error(
                    'Must provide default option when using optgroups'
                );
            }
        }

        const baseSchema = Joi.string().valid(
            this._normalisedOptions().map(option => option.value)
        );

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? baseSchema.required()
                : baseSchema.optional();
        }
    }

    _normalisedOptions() {
        if (this.optgroups.length > 0) {
            return flatMap(this.optgroups, group => group.options);
        } else {
            return this.options;
        }
    }

    get displayValue() {
        if (this.value) {
            const match = find(option => option.value === this.value)(
                this._normalisedOptions()
            );
            return match ? match.label : '';
        } else {
            return '';
        }
    }
}

module.exports = SelectField;
