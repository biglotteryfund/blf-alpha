'use strict';
const Joi = require('../joi-extensions');

const Field = require('./field');

class PhoneField extends Field {
    getType() {
        return 'tel';
    }

    defaultAttributes() {
        return { autocomplete: 'tel' };
    }

    defaultLabel() {
        return this.localise({
            en: `Telephone number`,
            cy: `Rhif ffôn`
        });
    }

    defaultSchema() {
        if (this.isRequired) {
            return Joi.string()
                .phoneNumber()
                .required();
        } else {
            return Joi.string()
                .phoneNumber()
                .allow('')
                .optional();
        }
    }

    defaultMessages() {
        return [
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
