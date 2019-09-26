'use strict';
const defaults = require('lodash/defaults');
const Joi = require('../joi-extensions');

const Field = require('./field');

class PhoneField extends Field {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'tel';

        this.attributes = defaults(
            { size: 30, autocomplete: 'tel' },
            props.attributes
        );

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.string().phoneNumber()
                : Joi.string()
                      .phoneNumber()
                      .allow('')
                      .optional();
        }

        if (!props.label) {
            this.label = this.localise({
                en: `Telephone number`,
                cy: `Rhif ffôn`
            });
        }

        this.messages = [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter a UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig'
                })
            },
            {
                type: 'string.phonenumber',
                message: this.localise({
                    en: 'Enter a real UK telephone number',
                    cy: 'Rhowch rif ffôn Prydeinig go iawn'
                })
            }
        ];
    }
}

module.exports = PhoneField;
