'use strict';
const countWords = require('../count-words');
const Joi = require('../joi-extensions');

const Field = require('./field');

class TextareaField extends Field {
    constructor(props) {
        super(props);

        if (props.labelDetails) {
            this.labelDetails = props.labelDetails;
        }

        const minWords = props.minWords || 0;
        const maxWords = props.maxWords;

        this.settings = {
            stackedSummary: true,
            showWordCount: true,
            minWords: minWords,
            maxWords: maxWords
        };

        const baseSchema = Joi.string()
            .minWords(minWords)
            .maxWords(maxWords);

        if (props.schema) {
            this.schema = props.schema;
        } else if (this.isRequired) {
            this.schema = baseSchema.required();
        } else {
            this.schema = baseSchema.allow('').optional();
        }

        this.messages = [
            {
                type: 'string.minWords',
                message: this.localise({
                    en: `Answer must be at least ${minWords} words`,
                    cy: `Rhaid i’r ateb fod yn o leiaf ${minWords} gair`
                })
            },
            {
                type: 'string.maxWords',
                message: this.localise({
                    en: `Answer must be no more than ${maxWords} words`,
                    cy: `Rhaid i’r ateb fod yn llai na ${maxWords} gair`
                })
            }
        ].concat(props.messages || []);
    }

    getType() {
        return 'textarea';
    }

    defaultAttributes() {
        return { rows: 15 };
    }

    get displayValue() {
        if (this.value) {
            const val = this.value.toString();
            const words = this.localise({ en: 'words', cy: 'gair' });
            return `${val}\n\n(${countWords(val)} ${words})`;
        } else {
            return '';
        }
    }
}

module.exports = TextareaField;
