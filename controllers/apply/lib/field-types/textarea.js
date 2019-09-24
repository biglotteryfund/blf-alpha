'use strict';
const defaults = require('lodash/defaults');
const countWords = require('../count-words');
const Joi = require('../joi-extensions');

const Field = require('./field');

class TextareaField extends Field {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'textarea';

        if (props.labelDetails) {
            this.labelDetails = props.labelDetails;
        }

        if (!props.minWords || !props.maxWords) {
            throw new Error('Must provide min and max words');
        }

        this.attributes = defaults({ rows: 15 }, props.attributes);

        this.settings = defaults(
            {
                stackedSummary: true,
                showWordCount: true,
                minWords: props.minWords,
                maxWords: props.maxWords
            },
            props.settings
        );

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.string()
                      .minWords(props.minWords)
                      .maxWords(props.maxWords)
                      .required()
                : Joi.string()
                      .minWords(props.minWords)
                      .maxWords(props.maxWords)
                      .allow('')
                      .optional();
        }

        this.messages = this.messages.concat([
            {
                type: 'string.minWords',
                message: this.localise({
                    en: `Answer must be at least ${props.minWords} words`,
                    cy: `Rhaid i’r ateb fod yn o leiaf ${props.minWords} gair`
                })
            },
            {
                type: 'string.maxWords',
                message: this.localise({
                    en: `Answer must be no more than ${props.maxWords} words`,
                    cy: `Rhaid i’r ateb fod yn llai na ${props.maxWords} gair`
                })
            }
        ]);
    }

    get displayValue() {
        if (this.value) {
            return (
                this.value.toString() +
                `\n\n(${countWords(this.value.toString())} ${this.localise({
                    en: 'words',
                    cy: 'gair'
                })})`
            );
        } else {
            return '';
        }
    }
}

module.exports = TextareaField;
