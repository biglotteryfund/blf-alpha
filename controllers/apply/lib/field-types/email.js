'use strict';
const defaults = require('lodash/defaults');
const { oneLine } = require('common-tags');
const Joi = require('../joi-extensions');

const Field = require('./field');

class EmailField extends Field {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'email';

        this.attributes = defaults(
            { size: 30, autocomplete: 'email' },
            props.attributes
        );

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = this.isRequired
                ? Joi.string()
                      .email()
                      .required()
                : Joi.string()
                      .email()
                      .optional();
        }

        if (!props.label) {
            this.label = this.localise({
                en: 'Email',
                cy: 'E-bost'
            });
        }

        this.messages = [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter an email address',
                    cy: 'Rhowch gyfeiriad e-bost'
                })
            },
            {
                type: 'string.email',
                message: this.localise({
                    en: oneLine`Email address must be in the correct format,
                        like name@example.com`,
                    cy: oneLine`Rhaid i’r cyfeiriad e-bost for yn y ffurf cywir,
                        e.e enw@example.com`
                })
            }
        ];
    }
}

module.exports = EmailField;
