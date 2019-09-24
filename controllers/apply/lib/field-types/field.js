'use strict';
const defaults = require('lodash/defaults');
const get = require('lodash/fp/get');

const Joi = require('../joi-extensions');

module.exports = class Field {
    constructor(props, locale = 'en') {
        this.locale = locale;

        /**
         * Used to switch on non-class type fields
         * @TODO: Remove this after fully migrating to field types
         */
        this._isClass = true;

        if (props.name) {
            this.name = props.name;
        } else {
            throw new Error('Must provide name');
        }

        this.label = props.label;
        this.labelDetails = props.labelDetails;
        this.explanation = props.explanation;

        this.type = props.type || 'text';

        this.attributes = defaults({ size: 30 }, props.attributes);
        this.settings = props.settings || {};

        this.isRequired = props.isRequired !== false;

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.string().required()
                : Joi.string()
                      .allow('')
                      .optional();
        }

        this.messages = props.messages || [];

        this.value = undefined;
        this.errors = [];
        this.featuredErrors = [];
    }

    localise(msg) {
        return get(this.locale)(msg);
    }

    withValue(value) {
        this.value = value;
        return this;
    }

    withErrors(errors) {
        this.errors = errors;
        return this;
    }

    withFeaturedErrors(featuredErrors) {
        this.featuredErrors = featuredErrors;
        return this;
    }

    validate() {
        return this.schema.validate(this.value);
    }

    get displayValue() {
        if (this.value) {
            return this.value.toString();
        } else {
            return '';
        }
    }
};
