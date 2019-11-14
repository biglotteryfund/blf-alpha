'use strict';
const defaults = require('lodash/defaults');
const get = require('lodash/fp/get');
const Joi = require('../joi-extensions');

class Field {
    constructor(props) {
        this.locale = props.locale || 'en';

        // Used to switch on non-class type fields
        // @TODO: Remove this after fully migrating to field types
        this._isClass = true;

        if (props.name) {
            this.name = props.name;
        } else {
            throw new Error('Must provide name');
        }

        const label = props.label ? props.label : this.defaultLabel();
        if (label) {
            this.label = label;
        } else {
            // @TODO: Re-enable once welsh translations have been added
            // throw new Error('Must provide label');
        }

        this.labelDetails = props.labelDetails;
        this.explanation = props.explanation;

        this.type = props.type ? props.type : this.getType();

        this.attributes = defaults(this.defaultAttributes(), props.attributes);

        this.settings = props.settings || {};

        this.isRequired = props.isRequired !== false;

        this._maxLength = props.maxLength || 255;
        this.schema = props.schema ? props.schema : this.defaultSchema();

        // @TODO Should this merge based on key rather than a plain concat?
        this.messages = this.defaultMessages().concat(props.messages || []);

        this.warnings = props.warnings || [];

        this.value = undefined;
        this.errors = [];
        this.featuredErrors = [];
    }

    getType() {
        return 'text';
    }

    /**
     * Allow sub-classes to provide a default label
     */
    defaultLabel() {
        return null;
    }

    /**
     * Allow sub-classes to provide a default schema
     * also allows it to be accessed by the instance
     */
    defaultSchema() {
        const baseSchema = Joi.string().max(this._maxLength);
        if (this.isRequired) {
            return baseSchema.required();
        } else {
            return baseSchema.allow('').optional();
        }
    }

    /**
     * Allow sub-classes to provide a default messages
     */
    defaultMessages() {
        return [];
    }

    /**
     * Allow sub-classes to provide default attributes
     */
    defaultAttributes() {
        return { size: 40 };
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
}

module.exports = Field;
