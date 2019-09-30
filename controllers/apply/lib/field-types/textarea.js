'use strict';
const countWords = require('../count-words');
const Joi = require('../joi-extensions');

const Field = require('./field');

class TextareaField extends Field {
    constructor(props, locale) {
        super(props, locale);

        if (props.labelDetails) {
            this.labelDetails = props.labelDetails;
        }

        this.minWords = props.minWords || 0;
        this.maxWords = props.maxWords;

        this.settings = {
            stackedSummary: true,
            showWordCount: true,
            minWords: this.minWords,
            maxWords: this.maxWords
        };

        const baseSchema = Joi.string()
            .minWords(this.minWords)
            .maxWords(this.maxWords);

        if (props.schema) {
            this.schema = props.schema;
        } else if (this.isRequired) {
            this.schema = baseSchema.required();
        } else {
            this.schema = baseSchema.allow('').optional();
        }
    }

    getType() {
        return 'textarea';
    }

    defaultAttributes() {
        return { rows: 15 };
    }

    defaultMessages() {
        return [
            {
                type: 'string.minWords',
                message: this.localise({
                    en: `Answer must be at least ${this.minWords} words`,
                    cy: `Rhaid i’r ateb fod yn o leiaf ${this.minWords} gair`
                })
            },
            {
                type: 'string.maxWords',
                message: this.localise({
                    en: `Answer must be no more than ${this.maxWords} words`,
                    cy: `Rhaid i’r ateb fod yn llai na ${this.maxWords} gair`
                })
            }
        ];
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
