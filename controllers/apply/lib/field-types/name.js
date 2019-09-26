'use strict';
const Joi = require('../joi-extensions');

const Field = require('./field');

class NameField extends Field {
    constructor(props, locale) {
        super(props, locale);

        this.type = 'full-name';

        if (props.schema) {
            this.schema = props.schema;
        } else {
            this.schema = Joi.object({
                firstName: Joi.string()
                    .max(40)
                    .required(),
                lastName: Joi.string()
                    .max(80)
                    .required()
            });
        }

        this.messages = [
            {
                type: 'base',
                message: this.localise({
                    en: 'Enter first and last name',
                    cy: 'Rhowch enw cyntaf a chyfenw'
                })
            },
            {
                type: 'any.empty',
                key: 'firstName',
                message: this.localise({
                    en: 'Enter first name',
                    cy: 'Rhowch enw cyntaf'
                })
            },
            {
                type: 'string.max',
                key: 'firstName',
                message: this.localise({
                    en: `First name must be 40 characters or less`,
                    cy: `Rhaid i’r enw cyntaf fod yn llai na 40 nod`
                })
            },
            {
                type: 'string.max',
                key: 'lastName',
                message: this.localise({
                    en: `Last name must be 80 characters or less`,
                    cy: `Rhaid i’r cyfenw fod yn llai na 80 nod`
                })
            },
            {
                type: 'any.empty',
                key: 'lastName',
                message: this.localise({
                    en: 'Enter last name',
                    cy: 'Rhowch gyfenw'
                })
            }
        ].concat(props.messages || []);
    }

    get displayValue() {
        if (this.value) {
            return `${this.value.firstName} ${this.value.lastName}`;
        } else {
            return '';
        }
    }
}

module.exports = NameField;
