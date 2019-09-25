'use strict';
const { oneLine } = require('common-tags');
const Joi = require('../joi-extensions');

const Field = require('./field');

class EmailField extends Field {
    getType() {
        return 'email';
    }

    defaultAttributes() {
        return { autocomplete: 'email' };
    }

    defaultLabel() {
        return this.localise({
            en: 'Email',
            cy: 'E-bost'
        });
    }

    defaultSchema() {
        if (this.isRequired) {
            return Joi.string()
                .email()
                .required();
        } else {
            return Joi.string()
                .email()
                .optional();
        }
    }

    defaultMessages() {
        return [
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
