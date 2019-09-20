'use strict';
const Joi = require('./joi-extensions');

class TextField {
    constructor(props) {
        if (props.name) {
            this.name = props.name;
        } else {
            throw new Error('Must provide name');
        }

        if (props.label) {
            this.label = props.label;
        } else {
            // throw new Error('Must provide label');
        }

        this.labelDetails = props.labelDetails;
        this.explanation = props.explanation;

        this.type = props.type || 'text';

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

        this.attributes = props.attributes || {};
        this.settings = props.settings || {};
    }
}

class RadioField extends TextField {
    constructor(props) {
        super(props);
        this.type = 'radio';

        const options = props.options || [];
        if (options.length === 0) {
            throw Error('Must provide options');
        }

        this.options = options;

        const multiChoice = Joi.array()
            .items(Joi.string().valid(options.map(option => option.value)))
            .single();

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? multiChoice.required()
                : multiChoice.optional();
        }
    }
}

module.exports = {
    TextField,
    RadioField
};
